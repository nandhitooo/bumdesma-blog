import {
  BLOCK_TYPES,
  DEFAULT_FONT_FAMILY,
  FONT_FAMILIES,
  FONT_SIZES,
  HIGHLIGHT_COLORS,
  TEXT_COLORS,
} from "./editorFormats";

// Perbandingan font tidak peka kutip/spasi besar-kecil, karena browser bisa
// mengembalikan "Times New Roman" dengan atau tanpa tanda kutip.
const normalizeFont = (value) =>
  (value || "").replace(/["']/g, "").trim().toLowerCase();

const ALIGNMENTS = [
  { label: "Rata kiri", value: "left", icon: "align-left" },
  { label: "Rata tengah", value: "center", icon: "align-center" },
  { label: "Rata kanan", value: "right", icon: "align-right" },
  { label: "Rata kanan kiri", value: "justify", icon: "align-justify" },
];

const selectClass =
  "min-h-[44px] rounded-lg border border-gray-200 bg-white px-2 text-sm font-semibold text-gray-700 outline-none focus:border-green-700";

function ToolbarButton({ label, active, disabled, onClick, icon }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg px-3 font-bold transition disabled:opacity-40 ${
        active ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <i className={`fa-solid fa-${icon}`} aria-hidden="true"></i>
    </button>
  );
}

// Nilai yang ditampilkan di <select> harus mencerminkan format di posisi kursor.
// Pilihan kosong berarti "bawaan": memilihnya menghapus style, bukan menyimpan
// nilai yang sama dengan bawaan.
function currentFontFamily(editor) {
  const stored = editor.getAttributes("textStyle").fontFamily || "";
  const match = FONT_FAMILIES.find(
    (font) => normalizeFont(font.value) === normalizeFont(stored),
  );
  if (!match || match.value === DEFAULT_FONT_FAMILY) return "";
  return match.value;
}

function currentFontSize(editor) {
  const stored = (editor.getAttributes("textStyle").fontSize || "").trim();
  const px = /^(\d+)px$/.exec(stored);
  if (!px || !FONT_SIZES.includes(Number(px[1]))) return "";
  return stored;
}

function currentColor(editor) {
  const stored = (editor.getAttributes("textStyle").color || "").toLowerCase();
  return TEXT_COLORS.some((color) => color.value === stored) ? stored : "";
}

function currentHighlight(editor) {
  const stored = (editor.getAttributes("highlight").color || "").toLowerCase();
  return HIGHLIGHT_COLORS.some((color) => color.value === stored) ? stored : "";
}

function currentBlockType(editor) {
  const level = [2, 3, 4].find((value) =>
    editor.isActive("heading", { level: value }),
  );
  return level ? String(level) : "p";
}

function EditorToolbar({
  editor,
  onInsertLink,
  onPickImage,
  imageUploading = false,
}) {
  if (!editor) return null;

  const fontFamily = currentFontFamily(editor);
  const fontSize = currentFontSize(editor);
  const color = currentColor(editor);
  const highlight = currentHighlight(editor);
  const blockType = currentBlockType(editor);
  const alignment =
    ALIGNMENTS.find((item) => editor.isActive({ textAlign: item.value }))
      ?.value ?? "left";
  // Rata kiri adalah bawaan, jadi hanya perataan eksplisit yang perlu dibawa
  // saat tipe blok diganti (mengganti node menghapus atribut perataan).
  const explicitAlignment = ALIGNMENTS.find(
    (item) => item.value !== "left" && editor.isActive({ textAlign: item.value }),
  )?.value;

  const setFontFamily = (value) => {
    const chain = editor.chain().focus();
    if (!value) {
      chain.unsetFontFamily().run();
      return;
    }
    chain.setFontFamily(value).run();
  };

  const setFontSize = (value) => {
    const chain = editor.chain().focus();
    if (!value) {
      chain.unsetFontSize().run();
      return;
    }
    chain.setFontSize(value).run();
  };

  const setBlockType = (value) => {
    const chain = editor.chain().focus();
    if (value === "p") chain.setParagraph();
    else chain.setHeading({ level: Number(value) });
    if (explicitAlignment) chain.setTextAlign(explicitAlignment);
    chain.run();
  };

  const setColor = (value) => {
    const chain = editor.chain().focus();
    if (!value) {
      chain.unsetColor().run();
      return;
    }
    chain.setColor(value).run();
  };

  const setHighlight = (value) => {
    const chain = editor.chain().focus();
    if (!value) {
      chain.unsetHighlight().run();
      return;
    }
    chain.setHighlight({ color: value }).run();
  };

  const setAlignment = (value) => {
    const chain = editor.chain().focus();
    if (value === "left") {
      chain.unsetTextAlign().run();
      return;
    }
    chain.setTextAlign(value).run();
  };

  return (
    <div
      role="toolbar"
      aria-label="Alat format teks"
      className="flex flex-wrap items-center gap-1 border-b border-gray-100 p-3"
    >
      <label className="sr-only" htmlFor="editor-block-type">
        Gaya blok
      </label>
      <select
        id="editor-block-type"
        aria-label="Gaya blok"
        value={blockType}
        onChange={(event) => setBlockType(event.target.value)}
        className={selectClass}
      >
        {BLOCK_TYPES.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="editor-font-family">
        Jenis huruf
      </label>
      <select
        id="editor-font-family"
        aria-label="Jenis huruf"
        value={fontFamily}
        onChange={(event) => setFontFamily(event.target.value)}
        className={selectClass}
      >
        {/* Font bawaan halaman memakai nilai kosong supaya memilihnya
            menghapus font-family, bukan menyimpan nilai yang sama. */}
        {FONT_FAMILIES.map((font) => (
          <option
            key={font.value}
            value={font.value === DEFAULT_FONT_FAMILY ? "" : font.value}
          >
            {font.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="editor-font-size">
        Ukuran huruf
      </label>
      <select
        id="editor-font-size"
        aria-label="Ukuran huruf"
        value={fontSize}
        onChange={(event) => setFontSize(event.target.value)}
        className={selectClass}
      >
        <option value="">Ukuran bawaan</option>
        {FONT_SIZES.map((size) => (
          <option key={size} value={`${size}px`}>
            {size} px
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="editor-color">
        Warna teks
      </label>
      <select
        id="editor-color"
        aria-label="Warna teks"
        value={color}
        onChange={(event) => setColor(event.target.value)}
        className={selectClass}
      >
        <option value="">Warna bawaan</option>
        {TEXT_COLORS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="editor-highlight">
        Warna sorotan
      </label>
      <select
        id="editor-highlight"
        aria-label="Warna sorotan"
        value={highlight}
        onChange={(event) => setHighlight(event.target.value)}
        className={selectClass}
      >
        <option value="">Tanpa sorotan</option>
        {HIGHLIGHT_COLORS.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>

      <span className="mx-1 h-8 w-px bg-gray-200" aria-hidden="true"></span>

      <ToolbarButton
        label="Tebal"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        icon="bold"
      />
      <ToolbarButton
        label="Miring"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        icon="italic"
      />
      <ToolbarButton
        label="Garis bawah"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        icon="underline"
      />
      <ToolbarButton
        label="Coret"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        icon="strikethrough"
      />

      <span className="mx-1 h-8 w-px bg-gray-200" aria-hidden="true"></span>

      {ALIGNMENTS.map((item) => (
        <ToolbarButton
          key={item.value}
          label={item.label}
          active={alignment === item.value}
          onClick={() => setAlignment(item.value)}
          icon={item.icon}
        />
      ))}

      <span className="mx-1 h-8 w-px bg-gray-200" aria-hidden="true"></span>

      <ToolbarButton
        label="Daftar poin"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        icon="list-ul"
      />
      <ToolbarButton
        label="Daftar nomor"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        icon="list-ol"
      />
      <ToolbarButton
        label="Kutipan"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        icon="quote-left"
      />
      <ToolbarButton
        label="Garis pemisah"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        icon="minus"
      />

      <span className="mx-1 h-8 w-px bg-gray-200" aria-hidden="true"></span>

      <button
        type="button"
        title="Tautan"
        aria-label="Tautan"
        onClick={onInsertLink}
        className="flex min-h-[44px] items-center rounded-lg px-3 font-bold text-gray-700 hover:bg-gray-100"
      >
        <i className="fa-solid fa-link mr-2" aria-hidden="true"></i>
        Tautan
      </button>
      <button
        type="button"
        title="Gambar"
        aria-label="Gambar"
        onClick={onPickImage}
        disabled={imageUploading}
        className="flex min-h-[44px] items-center rounded-lg px-3 font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
      >
        <i className="fa-regular fa-image mr-2" aria-hidden="true"></i>
        {imageUploading ? "Mengunggah..." : "Gambar"}
      </button>

      <span className="mx-1 h-8 w-px bg-gray-200" aria-hidden="true"></span>

      <ToolbarButton
        label="Urungkan"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        icon="rotate-left"
      />
      <ToolbarButton
        label="Ulangi"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        icon="rotate-right"
      />
      <ToolbarButton
        label="Hapus format"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        icon="eraser"
      />
    </div>
  );
}

export default EditorToolbar;

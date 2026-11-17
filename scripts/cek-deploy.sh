#!/usr/bin/env bash
# Pemeriksaan deploy produksi (Caddy + TLS).
#
#   bash scripts/cek-deploy.sh              # sebelum deploy
#   bash scripts/cek-deploy.sh --setelah    # setelah stack berjalan
#
# Nilai dibaca dari environment atau dari .env di root repo. Variabel yang
# dipakai: DOMAIN, ACME_EMAIL, PUBLIC_SITE_URL, CLIENT_ORIGIN, JWT_SECRET,
# POSTGRES_PASSWORD, dan opsional SERVER_IP untuk membandingkan hasil DNS.
#
# Skrip ini hanya memeriksa; tidak menjalankan atau mengubah apa pun.
set -uo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT" || exit 1

MODE="sebelum"
case "${1-}" in
    --setelah) MODE="setelah" ;;
    "") ;;
    *)
        echo "Pemakaian: bash scripts/cek-deploy.sh [--setelah]" >&2
        exit 2
        ;;
esac

GAGAL=0
PERIKSA=0

if [ -t 1 ]; then
    HIJAU=$'\033[32m'; MERAH=$'\033[31m'; KUNING=$'\033[33m'; TEBAL=$'\033[1m'; NORMAL=$'\033[0m'
else
    HIJAU=""; MERAH=""; KUNING=""; TEBAL=""; NORMAL=""
fi

ok()    { printf '  %sOK%s      %s\n'      "$HIJAU" "$NORMAL" "$*"; }
gagal() { printf '  %sGAGAL%s   %s\n'      "$MERAH" "$NORMAL" "$*"; GAGAL=$((GAGAL + 1)); }
periksa() { printf '  %sPERIKSA%s %s\n'    "$KUNING" "$NORMAL" "$*"; PERIKSA=$((PERIKSA + 1)); }
info()  { printf '          %s\n' "$*"; }
judul() { printf '\n%s%s%s\n' "$TEBAL" "$*" "$NORMAL"; }

# ---------------------------------------------------------------- variabel
ENV_FILE="${ENV_FILE:-.env}"
if [ -f "$ENV_FILE" ]; then
    while IFS= read -r baris || [ -n "$baris" ]; do
        case "$baris" in ''|'#'*) continue ;; esac
        kunci=${baris%%=*}
        [ "$kunci" = "$baris" ] && continue
        nilai=${baris#*=}
        nilai=${nilai%\"}; nilai=${nilai#\"}
        nilai=${nilai%\'}; nilai=${nilai#\'}
        # Environment yang sudah diisi tidak ditimpa berkas.
        [ -z "${!kunci-}" ] && export "$kunci=$nilai"
    done < "$ENV_FILE"
fi

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

# ------------------------------------------------------- 1. berkas & env
judul "1. Berkas dan variabel"

for berkas in docker-compose.yml docker-compose.prod.yml Caddyfile; do
    if [ -f "$berkas" ]; then ok "berkas $berkas ada"; else gagal "berkas $berkas tidak ditemukan"; fi
done

wajib=(DOMAIN ACME_EMAIL PUBLIC_SITE_URL CLIENT_ORIGIN JWT_SECRET POSTGRES_PASSWORD)
kosong=()
for nama in "${wajib[@]}"; do
    [ -n "${!nama-}" ] || kosong+=("$nama")
done
if [ ${#kosong[@]} -gt 0 ]; then
    gagal "variabel belum diisi: ${kosong[*]}"
    info "salin contoh di README bagian 'Deploy ke server' ke $ENV_FILE, lalu isi nilainya."
else
    ok "semua variabel wajib terisi"
fi

DOMAIN_VALID=0
if [ -n "${DOMAIN-}" ]; then
    case "$DOMAIN" in
        *://*|*/*) gagal "DOMAIN harus nama host saja, tanpa http:// atau garis miring" ;;
        localhost|*".localhost") gagal "DOMAIN masih host lokal; ACME tidak bisa menerbitkan sertifikat" ;;
        *.*) ok "DOMAIN $DOMAIN berbentuk nama host"; DOMAIN_VALID=1 ;;
        *) gagal "DOMAIN $DOMAIN tidak berisi titik, bukan domain publik" ;;
    esac
fi

if [ -n "${PUBLIC_SITE_URL-}" ] && [ "$DOMAIN_VALID" = 1 ]; then
    harap="https://${DOMAIN-}"
    if [ "$PUBLIC_SITE_URL" != "$harap" ]; then
        gagal "PUBLIC_SITE_URL harus $harap (tanpa slash di akhir)"
    else
        ok "PUBLIC_SITE_URL cocok dengan DOMAIN"
    fi
fi

if [ -n "${CLIENT_ORIGIN-}" ] && [ "$DOMAIN_VALID" = 1 ]; then
    case ",$CLIENT_ORIGIN," in
        *",https://${DOMAIN-},"*) ok "CLIENT_ORIGIN memuat https://${DOMAIN-}" ;;
        *) gagal "CLIENT_ORIGIN tidak memuat https://${DOMAIN-}; API akan menolak permintaan tulis" ;;
    esac
fi

if [ -n "${JWT_SECRET-}" ]; then
    if [ ${#JWT_SECRET} -lt 32 ]; then
        gagal "JWT_SECRET hanya ${#JWT_SECRET} karakter; gunakan minimal 32"
    else
        ok "JWT_SECRET ${#JWT_SECRET} karakter"
    fi
fi

if [ -n "${POSTGRES_PASSWORD-}" ]; then
    if [ "$POSTGRES_PASSWORD" = "bumdesma" ]; then
        gagal "POSTGRES_PASSWORD masih nilai default"
    elif [ ${#POSTGRES_PASSWORD} -lt 12 ]; then
        gagal "POSTGRES_PASSWORD hanya ${#POSTGRES_PASSWORD} karakter; gunakan minimal 12"
    else
        ok "POSTGRES_PASSWORD ${#POSTGRES_PASSWORD} karakter"
    fi
fi

# -------------------------------------------------------------- 2. docker
judul "2. Docker dan Compose"

versi_docker=$(docker version --format '{{.Server.Version}}' 2>/dev/null || true)
if [ -n "$versi_docker" ]; then
    ok "daemon Docker $versi_docker"
else
    gagal "daemon Docker tidak dapat dihubungi (jalankan sebagai root atau di grup docker)"
fi

versi_compose=$(docker compose version --short 2>/dev/null || true)
if [ -z "$versi_compose" ]; then
    gagal "plugin 'docker compose' tidak ditemukan; pasang docker-compose-plugin"
else
    mayor=${versi_compose%%.*}
    sisa=${versi_compose#*.}
    minor=${sisa%%.*}
    if [ "${mayor:-0}" -gt 2 ] || { [ "${mayor:-0}" -eq 2 ] && [ "${minor:-0}" -ge 24 ]; }; then
        ok "Docker Compose $versi_compose (>= 2.24, mendukung tag !reset)"
    else
        gagal "Docker Compose $versi_compose terlalu lama; profil produksi butuh 2.24+"
    fi
fi

if ! docker compose version >/dev/null 2>&1; then
    periksa "validasi gabungan compose dilewati karena plugin compose belum siap"
elif [ ${#kosong[@]} -gt 0 ]; then
    periksa "validasi gabungan compose dilewati karena variabel wajib belum lengkap"
else
    if $COMPOSE config >/dev/null 2>&1; then
        ok "compose dasar + produksi bisa digabung"
    else
        gagal "gabungan compose gagal divalidasi; jalankan '$COMPOSE config' untuk melihat pesan"
    fi
fi

# ---------------------------------------------------------------- 3. DNS
judul "3. DNS"

IP_SERVER=${SERVER_IP-}
if [ -z "$IP_SERVER" ]; then
    IP_SERVER=$(curl -4 -fsS --max-time 8 https://api.ipify.org 2>/dev/null || true)
    [ -n "$IP_SERVER" ] && info "IP publik server terdeteksi: $IP_SERVER"
fi

if [ -z "${DOMAIN-}" ]; then
    periksa "DNS dilewati karena DOMAIN belum diisi"
else
    if command -v dig >/dev/null 2>&1; then
        alamat_a=$(dig +short A "$DOMAIN" | grep -E '^[0-9.]+$' | sort -u)
        alamat_aaaa=$(dig +short AAAA "$DOMAIN" | grep -E '^[0-9a-fA-F:]+$' | sort -u)
        caa=$(dig +short CAA "$DOMAIN" | grep -i 'issue' || true)
    else
        alamat_a=$(getent ahostsv4 "$DOMAIN" 2>/dev/null | awk '{print $1}' | sort -u)
        alamat_aaaa=$(getent ahostsv6 "$DOMAIN" 2>/dev/null | awk '{print $1}' | grep -v '^::ffff:' | sort -u)
        caa=""
        info "'dig' tidak ada; memakai getent sehingga catatan CAA tidak diperiksa"
    fi

    if [ -z "$alamat_a" ]; then
        gagal "tidak ada catatan A untuk $DOMAIN; arahkan domain ke IP server lebih dulu"
    else
        ok "A $DOMAIN → $(echo "$alamat_a" | tr '\n' ' ')"
        if [ -z "$IP_SERVER" ]; then
            periksa "IP server tidak diketahui; bandingkan manual apakah salah satu alamat di atas milik server ini"
        elif echo "$alamat_a" | grep -qx "$IP_SERVER"; then
            ok "DNS menunjuk ke IP server ini ($IP_SERVER)"
        else
            gagal "DNS menunjuk ke $(echo "$alamat_a" | tr '\n' ' ') sedangkan IP server $IP_SERVER"
            info "perbarui catatan A, atau jalankan ulang dengan SERVER_IP=<ip> bila deteksi IP keliru"
        fi
    fi

    if [ -n "$alamat_aaaa" ]; then
        periksa "ada catatan AAAA ($(echo "$alamat_aaaa" | tr '\n' ' ')); pastikan IPv6 juga sampai ke server atau hapus catatannya"
    fi

    if [ -n "$caa" ]; then
        if echo "$caa" | grep -qi "letsencrypt.org"; then
            ok "catatan CAA mengizinkan letsencrypt.org"
        else
            periksa "catatan CAA ada tetapi tidak menyebut letsencrypt.org; penerbitan sertifikat akan gagal"
        fi
    fi
fi

# ------------------------------------------------------ 4. port 80 dan 443
judul "4. Port 80 dan 443"

cek_port() {
    porta=$1
    proto=$2
    if ! command -v ss >/dev/null 2>&1; then
        periksa "perintah 'ss' tidak ada; port $porta/$proto tidak bisa diperiksa"
        return
    fi
    if [ "$proto" = "tcp" ]; then
        pemakai=$(ss -H -ltnp "sport = :$porta" 2>/dev/null | sed 's/.*users:((//; s/)).*//')
    else
        pemakai=$(ss -H -lunp "sport = :$porta" 2>/dev/null | sed 's/.*users:((//; s/)).*//')
    fi

    if [ -z "$pemakai" ]; then
        if [ "$porta" = 443 ] && [ "$proto" = udp ]; then
            ok "port 443/udp bebas (HTTP/3 opsional)"
        else
            ok "port $porta/$proto bebas"
        fi
        return
    fi

    if echo "$pemakai" | grep -qi 'docker'; then
        if docker ps --format '{{.Names}} {{.Ports}}' 2>/dev/null | grep -q "caddy"; then
            ok "port $porta/$proto dipakai container caddy milik stack ini"
        else
            periksa "port $porta/$proto dipakai Docker ($pemakai) tetapi container caddy tidak berjalan"
        fi
    else
        gagal "port $porta/$proto sudah dipakai proses lain ($pemakai); Caddy tidak bisa start"
        info "hentikan proses itu atau bebaskan port sebelum deploy"
    fi
}

cek_port 80 tcp
cek_port 443 tcp
cek_port 443 udp

if command -v ufw >/dev/null 2>&1; then
    status_ufw=$(ufw status 2>/dev/null | head -1 || true)
    if echo "$status_ufw" | grep -qi 'active'; then
        periksa "ufw aktif; pastikan 80/tcp dan 443/tcp diizinkan (ufw allow 80,443/tcp)"
    else
        ok "ufw tidak aktif"
    fi
fi

# --------------------------------------------------------- 5. sumber daya
judul "5. Sumber daya"

akar_docker=$(docker info --format '{{.DockerRootDir}}' 2>/dev/null || echo /)
if [ -d "$akar_docker" ]; then
    sisa_mb=$(df -Pk "$akar_docker" | awk 'NR==2 {print $4}')
    if [ "${sisa_mb:-0}" -lt 5242880 ]; then
        gagal "ruang kosong $akar_docker hanya $((sisa_mb / 1024)) MB; sediakan minimal 5 GB"
    else
        ok "ruang kosong $akar_docker $((sisa_mb / 1024 / 1024)) GB"
    fi
else
    periksa "folder data Docker ($akar_docker) tidak terlihat dari sini"
fi

ram_mb=$(awk '/MemTotal/ {print int($2 / 1024)}' /proc/meminfo 2>/dev/null || echo 0)
if [ "${ram_mb:-0}" -gt 0 ] && [ "$ram_mb" -lt 1500 ]; then
    periksa "RAM ${ram_mb} MB; build image bisa gagal bila kurang dari 1,5 GB"
else
    [ "${ram_mb:-0}" -gt 0 ] && ok "RAM ${ram_mb} MB"
fi

if [ "$MODE" = "sebelum" ]; then
    judul "Langkah selanjutnya"
    info "1. jalankan: $COMPOSE up -d --build"
    info "2. buat admin pertama bila belum ada (variabel ADMIN_EMAIL + ADMIN_PASSWORD di .env)"
    info "3. uji dari jaringan lain: nc -vz ${DOMAIN:-DOMAIN} 443"
    info "4. setelah stack hidup: bash scripts/cek-deploy.sh --setelah"
fi

# --------------------------------------------------- mode setelah deploy
if [ "$MODE" = "setelah" ]; then
    ALAMAT="https://${DOMAIN-}"

    judul "6. Container"
    if docker ps --format '{{.Names}} {{.Status}}' | grep -q 'caddy'; then
        ok "container caddy berjalan"
    else
        gagal "container caddy tidak berjalan; lihat 'docker compose logs caddy'"
    fi
    for layanan in backend db; do
        status=$(docker ps --filter "name=$layanan" --format '{{.Names}} {{.Status}}' | head -1)
        if echo "$status" | grep -q 'healthy'; then
            ok "$layanan sehat"
        elif [ -n "$status" ]; then
            periksa "$layanan belum sehat: $status"
        else
            gagal "container $layanan tidak berjalan"
        fi
    done

    judul "7. Endpoint"
    sehat=0
    for _ in $(seq 1 15); do
        kode=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$ALAMAT/api/health" 2>/dev/null || true)
        if [ "$kode" = "200" ]; then sehat=1; break; fi
        sleep 2
    done
    if [ "$sehat" = "1" ]; then ok "$ALAMAT/api/health → 200"; else gagal "$ALAMAT/api/health tidak menjawab 200"; fi

    kode_beranda=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$ALAMAT/" 2>/dev/null || true)
    if [ "$kode_beranda" = "200" ]; then ok "beranda → 200"; else gagal "beranda → ${kode_beranda:-tidak ada jawaban}"; fi

    if [ -n "${PUBLIC_SITE_URL-}" ]; then
        if curl -s --max-time 10 "$ALAMAT/sitemap.xml" | grep -q "<loc>${PUBLIC_SITE_URL}/</loc>"; then
            ok "sitemap memakai $PUBLIC_SITE_URL"
        else
            gagal "sitemap tidak memuat <loc>${PUBLIC_SITE_URL}/</loc>"
        fi
    fi

    judul "8. Sertifikat"
    if command -v openssl >/dev/null 2>&1 && [ -n "${DOMAIN-}" ]; then
        keluaran=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null || true)
        terbit=$(echo "$keluaran" | openssl x509 -noout -issuer 2>/dev/null || true)
        akhir=$(echo "$keluaran" | openssl x509 -noout -enddate 2>/dev/null || true)
        verifikasi=$(echo "$keluaran" | grep 'Verify return code' || true)
        if [ -n "$terbit" ]; then
            ok "${terbit#issuer=}"
            info "${akhir#notAfter=}"
            if echo "$terbit" | grep -qi 'local'; then
                periksa "sertifikat berasal dari CA lokal, bukan ACME; hanya cocok untuk uji"
            fi
        else
            gagal "tidak bisa membaca sertifikat $DOMAIN:443"
        fi
        if echo "$verifikasi" | grep -q 'code: 0 (ok)'; then
            ok "rantai sertifikat valid"
        elif [ -n "$verifikasi" ]; then
            periksa "rantai sertifikat: ${verifikasi#*Verify return code: }"
        fi
    else
        periksa "pemeriksaan sertifikat dilewati (openssl/DOMAIN tidak tersedia)"
    fi

    judul "9. Header dan redirect"
    header=$(curl -sI --max-time 10 "$ALAMAT/" 2>/dev/null || true)
    echo "$header" | grep -qi 'strict-transport-security' && ok "HSTS ada" || gagal "HSTS tidak ada"
    echo "$header" | grep -qi 'x-content-type-options: nosniff' && ok "nosniff ada" || gagal "header nosniff tidak ada"
    echo "$header" | grep -qi 'content-security-policy' && ok "CSP ada" || gagal "header Content-Security-Policy tidak ada"

    kode_http=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://${DOMAIN-}/" 2>/dev/null || true)
    if [ "$kode_http" = "308" ] || [ "$kode_http" = "301" ] || [ "$kode_http" = "302" ]; then
        ok "http://${DOMAIN-}/ dialihkan ke https (${kode_http})"
    else
        gagal "http://${DOMAIN-}/ tidak mengalihkan ke https (kode ${kode_http:-tidak ada})"
    fi
fi

printf '\n%s%d pemeriksaan gagal, %d perlu dicek manual.%s\n' "$TEBAL" "$GAGAL" "$PERIKSA" "$NORMAL"
[ "$GAGAL" -eq 0 ]

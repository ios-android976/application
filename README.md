# ☕ Coffee Shop

Кофе шопын **мобайл апп** (iOS + Android, Expo Go) болон **админ самбар** (Next.js, Vercel) — нэг monorepo дотор, Supabase дээр.

| | Нэвтрэлт | Технологи |
|---|---|---|
| `apps/mobile` — үйлчлүүлэгчийн апп | **Шаардлагагүй** | Expo SDK 57, Expo Router, TypeScript |
| `apps/admin` — админ самбар | **Шаардлагатай** (имэйл + нууц үг) | Next.js 16, Tailwind CSS 4, TypeScript |
| `packages/shared` — нийтлэг код | — | Supabase төрлүүд, query, формат |
| `supabase/` — өгөгдлийн сан | — | Postgres, RLS, RPC, Storage, Realtime |

Monorepo: **pnpm workspaces + Turborepo**.

## Боломжууд

**Мобайл апп** (нэвтрэхгүйгээр)
- Нүүр: онцлох бүтээгдэхүүн, ангилал, идэвхтэй захиалгын мэдэгдэл
- Цэс: ангиллаар шүүх, хайх, “Дууссан” бараа
- Бүтээгдэхүүн: хэмжээ (S/M/L), тоо ширхэг, сагсанд нэмэх
- Сагс: тоо өөрчлөх, хасах, апп хаагдсан ч хадгалагдана
- Захиалах: нэр, утас, “Авч явах / Энд уух”, нэмэлт хүсэлт
- Захиалгын явц: Хүлээн авсан → Бэлтгэж байна → Бэлэн → Олгосон (автоматаар шинэчлэгдэнэ)
- Өмнөх захиалгууд (тухайн утсанд хадгалагдана)

**Админ самбар** (нэвтэрсэн админ л)
- Хянах самбар: өнөөдрийн орлого, захиалга, дундаж чек, 7 хоногийн график, их зарагдсан бараа
- Захиалгын самбар: **realtime** — шинэ захиалга дуугаар мэдэгдэж, хуудас шинэчлэхгүйгээр гарч ирнэ; нэг товчоор төлөв солих, цуцлах
- Захиалгын түүх: төлөвөөр шүүх, хуудаслалт
- Бүтээгдэхүүн: нэмэх/засах/устгах, зураг upload, хэмжээ ба үнэ, “Дууссан” болгох, онцлох
- Ангилал: нэмэх/засах/устгах, эрэмбэ

## Аюулгүй байдал

- Апп **anon/publishable key**-ээр ажилладаг. Цэс уншиж, `place_order()` болон `get_orders()` RPC-ээр л захиалгатай харьцана — `orders` хүснэгтийг шууд уншиж чадахгүй.
- **Үнийг үргэлж сервер тооцно** (`place_order` нь бүтээгдэхүүний хүснэгтээс үнэ авна), тиймээс апп-аас үнэ хуурамчаар илгээх боломжгүй.
- Захиалгын UUID нь “баримт” болж ажиллана; утасны дугаарыг апп руу хэзээ ч буцаадаггүй.
- Админ эрх = `public.admins` хүснэгтэд бүртгэлтэй хэрэглэгч. Бүх хүснэгт, storage-ийн RLS бодлого `is_admin()`-ыг шалгадаг. Proxy, layout, server action бүр дахин шалгана.
- Олон нийтийн бүртгэл (sign up) хаалттай.

## Локал дээр ажиллуулах

Шаардлага: Node.js 20+, pnpm, Docker (локал Supabase-д), утсандаа **Expo Go** апп.

```bash
pnpm install
pnpm db:start          # Docker дээр Supabase асаана, migration + seed ачаална
pnpm supabase status   # API URL болон Publishable key-г харуулна
```

`.env.example` файлуудыг хуулж, дээрх утгуудаар бөглөнө:

```bash
cp apps/admin/.env.example apps/admin/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

**Админ самбар:**

```bash
pnpm dev:admin         # http://localhost:3000
```

Локал админ бүртгэл `supabase/seed.sql` файлын эхэнд бий (зөвхөн локал).

**Мобайл апп:**

```bash
pnpm dev:mobile
```

Терминалд гарах QR кодыг iPhone-ий камераар эсвэл Android дээр Expo Go-оор уншуулна. Утас, компьютер нэг Wi-Fi-д байх ёстой. `.env.local`-д `127.0.0.1` байвал апп автоматаар компьютерийн LAN хаягийг ашиглана.

## Production руу гаргах

### 1. Supabase

1. [supabase.com](https://supabase.com) дээр төсөл үүсгэнэ.
2. Schema-г түлхэнэ:
   ```bash
   pnpm supabase login
   pnpm supabase link --project-ref <project-ref>
   pnpm supabase db push
   ```
3. **Authentication → Sign In / Providers** дээр “Allow new users to sign up”-г унтраана.
4. **Authentication → Users → Add user** — админы имэйл, нууц үгийг үүсгэнэ.
5. **SQL Editor** дээр тухайн хэрэглэгчийг админ болгоно:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'tanii@email.mn';
   ```
6. Цэсээ админ самбараас оруулна (seed зөвхөн локалд ажилладаг).

### 2. Vercel (админ самбар)

1. Repo-г GitHub руу push хийгээд Vercel дээр **Import Project**.
2. **Root Directory**: `apps/admin` (Framework: Next.js автоматаар танина).
3. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy. Vercel monorepo, pnpm, Turborepo-г өөрөө танина.

### 3. Мобайл апп

- Хөгжүүлэлт/туршилт: Expo Go (`pnpm dev:mobile`). `apps/mobile/.env.local`-д production Supabase-ийн URL, key-г тавина.
- App Store / Google Play: [EAS Build](https://docs.expo.dev/build/introduction/) — `cd apps/mobile && npx eas-cli@latest build`. Апп-ын нэр, bundle ID `apps/mobile/app.json`-д, icon-ууд `apps/mobile/assets/`-д.

## Скриптүүд

| Команд | Үйлдэл |
|---|---|
| `pnpm dev:admin` | Админ самбар (localhost:3000) |
| `pnpm dev:mobile` | Expo dev server (QR код) |
| `pnpm typecheck` | Бүх багцын TypeScript шалгалт |
| `pnpm lint` | ESLint |
| `pnpm build:admin` | Админ production build |
| `pnpm db:start` / `db:stop` | Локал Supabase асаах/зогсоох |
| `pnpm db:reset` | Локал DB-г migration + seed-ээр дахин үүсгэх |
| `pnpm db:types` | `packages/shared/src/database.types.ts`-г DB-ээс дахин үүсгэх |

Schema өөрчлөх бол `supabase/migrations/`-д шинэ файл нэмээд `pnpm db:reset`, дараа нь `pnpm db:types`.

## Өөрчлөх газрууд

- Кофе шопын нэр, хаяг, цагийн хуваарь: `packages/shared/src/shop.ts`
- Апп-ын өнгө: `apps/mobile/src/constants/theme.ts`
- Админ самбарын өнгө: `apps/admin/app/globals.css`
- Захиалгын төлөвийн нэрс: `packages/shared/src/orders.ts`

## Бүтэц

```
coffee-shop/
├─ apps/
│  ├─ mobile/            Expo апп
│  │  └─ src/
│  │     ├─ app/         дэлгэцүүд (Expo Router): (tabs), product/[id], checkout, order/[id]
│  │     ├─ components/
│  │     ├─ hooks/       React Query (цэс, захиалга)
│  │     ├─ store/       сагс, төхөөрөмжийн мэдээлэл (zustand + AsyncStorage)
│  │     └─ lib/supabase.ts
│  └─ admin/             Next.js самбар
│     ├─ app/login/      нэвтрэх
│     ├─ app/(dashboard)/  хянах самбар, orders, products, categories
│     ├─ lib/supabase/   browser/server клиент, proxy (session refresh)
│     └─ proxy.ts        нэвтрээгүй хэрэглэгчийг /login руу
├─ packages/shared/      нийтлэг төрөл, query, формат
├─ supabase/
│  ├─ migrations/        schema, RLS, RPC, storage, realtime
│  └─ seed.sql           локал туршилтын өгөгдөл
└─ turbo.json
```

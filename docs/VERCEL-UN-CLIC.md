# Vercel en un paso (después de Supabase)

Ya iniciaste sesión en Vercel desde la terminal (`npx vercel login`). El proyecto **dashboard-class** está enlazado.

## Lo único que debes pegar tú

La **contraseña** de Supabase no la puede leer el asistente. Solo tú la tienes.

1. [Supabase](https://supabase.com/dashboard) → tu proyecto → **Connect**.
2. Pestaña **Transaction pooler** → tipo **URI**.
3. Copia la cadena y cambia `[YOUR-PASSWORD]` por tu contraseña real.
4. Abre `.env.local` en este proyecto y deja **solo esta línea** (o sustituye la que hay):

```env
DATABASE_URL=postgresql://postgres.buyjtlqxsuiqfagydaez:TU_CONTRASEÑA_AQUI@aws-0-us-east-2.pooler.supabase.com:6543/postgres
```

(La URI exacta puede variar; usa la que te muestra Supabase.)

5. En la terminal del proyecto:

```bash
pnpm vercel:env
```

Eso sube `DATABASE_URL` a Vercel y hace **redeploy** automático.

6. Abre https://dashboard-class.vercel.app (o la URL que imprima el deploy).

## Si algo falla

- `password authentication failed` → contraseña mal en la URI; resetea en Supabase → Database.
- Sigue el error de JSON → espera 1–2 min al redeploy o revisa **Vercel → Deployments → último → Logs**.

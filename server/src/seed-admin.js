import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';
const [name,email,password,institution='Mi institución']=process.argv.slice(2);
if(!name||!email||!password||password.length<12){console.error('Uso: node src/seed-admin.js "Nombre" email@ejemplo.com "clave-de-12-o-mas" "Institución"');process.exit(1)}
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});const client=await pool.connect();
try{await client.query('BEGIN');const i=await client.query('INSERT INTO institutions(name) VALUES($1) RETURNING id',[institution]);await client.query('INSERT INTO users(institution_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,$5)',[i.rows[0].id,name,email.toLowerCase(),await bcrypt.hash(password,12),'admin']);await client.query('COMMIT');console.log('Institución y administrador creados')}catch(e){await client.query('ROLLBACK');console.error(e.message);process.exitCode=1}finally{client.release();await pool.end()}

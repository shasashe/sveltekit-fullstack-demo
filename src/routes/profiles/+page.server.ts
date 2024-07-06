// import { error } from '@sveltejs/kit';
import { createPool } from '@vercel/postgres';
import { POSTGRES_URL } from '$env/static/private';

// Create a connection pool
const db = createPool({ connectionString: POSTGRES_URL });

export async function load() {
  try {
    // Fetch all rows from the names table
    const { rows: names } = await db.query('SELECT * FROM names');
    return { names };
  } catch (error) {
    console.log('Table does not exist, creating and seeding it with dummy data now...');
    // Table is not created yet
    await seed();
    const { rows: names } = await db.query('SELECT * FROM names');
    return { names };
  }
}

async function seed() {
  const client = await db.connect();
  await client.sql`
    CREATE TABLE IF NOT EXISTS names (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  console.log(`Created "names" table`);

  const users = await Promise.all([
    client.sql`
      INSERT INTO names (name, email)
      VALUES ('Rohan', 'rohan@tcl.com')
      ON CONFLICT (email) DO NOTHING;
    `,
    client.sql`
      INSERT INTO names (name, email)
      VALUES ('Rebecca', 'rebecca@tcl.com')
      ON CONFLICT (email) DO NOTHING;
    `,
    client.sql`
      INSERT INTO names (name, email)
      VALUES ('Vivek', 'vivek@gmail.com')
      ON CONFLICT (email) DO NOTHING;
    `,
  ]);

  console.log(`Seeded ${users.length} users`);

  return { users };
}

/** @type {import('./$types').Actions} */
export const actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const db = createPool({ connectionString: POSTGRES_URL });
    const client = await db.connect();

    const email = data.get('email');
    const name = data.get('name');

    await client.sql`
      INSERT INTO names (name, email)
      VALUES (${name}, ${email})
      ON CONFLICT (email) DO NOTHING;
    `;

    return { success: true };
  },

  delete: async ({ request }) => {
    const data = await request.formData();
    const db = createPool({ connectionString: POSTGRES_URL });
    const client = await db.connect();

    const id = data.get('id');

    await client.sql`
      DELETE FROM names
      WHERE id = ${id};
    `;

    return { success: true };
  },

  update: async ({ request }) => {
    const data = await request.formData();
    const db = createPool({ connectionString: POSTGRES_URL });
    const client = await db.connect();

    const ids = data.getAll('id[]');
    const emails = data.getAll('email[]');
    const names = data.getAll('name[]');

    for (let i = 0; i < ids.length; i++) {
      await client.sql`
        UPDATE names
        SET email = ${emails[i]}, name = ${names[i]}
        WHERE id = ${ids[i]};
      `;
    }

    return { success: true };
  },
};

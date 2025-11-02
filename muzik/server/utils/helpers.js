import { db, dbType } from '../config/database.js'

// Helper function to extract video ID from YouTube URL
export function extractVideoId(url) {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
}

// Helper function to execute database queries
export async function executeQuery(query, params = []) {
  if (dbType === 'postgresql') {
    const result = await db.query(query, params)
    return result.rows
  } else {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }
}

// Helper function to execute database query (single row)
export async function executeQueryOne(query, params = []) {
  if (dbType === 'postgresql') {
    const result = await db.query(query, params)
    return result.rows[0] || null
  } else {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) reject(err)
        else resolve(row || null)
      })
    })
  }
}

// Helper function to execute database insert/update/delete
export async function executeUpdate(query, params = []) {
  if (dbType === 'postgresql') {
    const result = await db.query(query, params)
    return {
      rowCount: result.rowCount,
      insertId: result.rows[0]?.id,
    }
  } else {
    return new Promise((resolve, reject) => {
      db.run(query, params, function (err) {
        if (err) reject(err)
        else
          resolve({
            rowCount: this.changes,
            insertId: this.lastID,
          })
      })
    })
  }
}


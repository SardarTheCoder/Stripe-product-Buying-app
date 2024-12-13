'use client'

import { useEffect, useState } from 'react'
import { supabase } from './utils/supabaseClient' // Adjust the path as necessary

const Home = () => {
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("user")
        .select('*')

      if (error) {
        console.error('Error fetching data:', error.message)
      } else {
        setData(data ?? [])
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      <h1>Supabase Data</h1>
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            <strong>Name:</strong> {item.name} <br />
            <strong>Email:</strong> {item.email}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Home

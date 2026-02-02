import React, { useState } from 'react'
import axios from 'axios'


const Test = () => {

    const [data,setData] = useState([]);

    const getData = async () => {
        const response = await axios.get('https://picsum.photos/v2/list?page=2&limit=30')
        setData (response.data)
        console.log(data)
    }

  return (
    <div className='p-10 bg-zinc-700 '>
      
      <button onClick={getData} className='bg-green-400 text-3xl text-white font-bold px-5 py-5 rounded active:-scale-30' >Get data</button>
      <div className='pt-5 mt-5 bg-gray-900'  >
            {data.map((elem,idx)=>{
                return <div key={idx} className='px-5 py-6 bg-gray-100  text-black flex items-center justify-between w-full rounded mb-3 '>
                    {elem.author}
                    <img className='h-80' src={elem.download_url} alt="" />
                    </div>
            })}
      </div>
    </div>
  )
}

export default Test

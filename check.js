const https = require('https'); 
https.get('https://nexis-itsm-web.vercel.app/admin', res => { 
  let data = ''; 
  res.on('data', c => data += c); 
  res.on('end', () => { 
    const matches = data.match(/<script src="(\/_next\/static\/chunks\/app\/admin\/page-[^"]+\.js)"/); 
    if (matches) { 
      console.log('Found chunk:', matches[1]); 
      https.get('https://nexis-itsm-web.vercel.app' + matches[1], r => { 
        let d = ''; 
        r.on('data', c => d += c); 
        r.on('end', () => console.log('Chunk has Desconhecido fix:', d.includes('Desconhecido'))); 
      }); 
    } else console.log('No chunk found'); 
  }); 
});

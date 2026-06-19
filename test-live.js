const tokenUrl = 'https://nexis-itsm-api.onrender.com/auth/register';
const ticketUrl = 'https://nexis-itsm-api.onrender.com/tickets';

async function test() {
  const email = `test${Date.now()}@test.com`;
  
  try {
    let res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Render', email, password: 'test', role: 'USER' })
    });
    
    if (!res.ok) {
      console.log('Register failed:', await res.text());
      return;
    }
    
    let data = await res.json();
    const token = data.access_token;
    console.log('Token OK');

    const formData = new FormData();
    formData.append('title', 'Teste Live Render');
    formData.append('description', 'Script description');
    formData.append('priority', 'MEDIUM');
    formData.append('type', 'INCIDENT');
    formData.append('category', 'Sistemas/Software');

    res = await fetch(ticketUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (!res.ok) {
      console.log('Ticket ERROR:', res.status, await res.text());
    } else {
      console.log('Ticket SUCCESS:', await res.json());
    }
  } catch (e) {
    console.error('Network Error:', e.message);
  }
}

test();

console.log("Hello from history.js");

async function startLoad() {
     const table = document.getElementById('searchTable');
     const ifEmpty = document.getElementById('ifEmpty');

     ifEmpty.classList.add('hide');
     table.classList.remove('hide');

     try {
          const response = await fetch('/getHistories', { credentials: 'include' });
          const searches = await response.json();

          if (!searches.length) {
               ifEmpty.classList.remove('hide');
               return;
          }

          searches.reverse().forEach(s => {
               let dateTime = s.createdAt.split('T');
               createSearchCard(s.income, s.countryCode, s.countryName,dateTime[0],dateTime[1].slice(0,5) );
          });

     } catch (err) {
          console.error('Load history failed:', err);
          ifEmpty.innerHTML = '<h3>Failed to load history</h3><p><a href="/history">Try Again</a></p>';
          ifEmpty.classList.remove('hide');
          table.classList.add('hide');
     }
}


startLoad();
function createSearchCard(amount, countryCode, countryName, date,time) {
     const tableBody = document.getElementById('tableBody');
     const row = tableBody.insertRow();
     
     row.insertCell(0).textContent = date;
     row.insertCell(1).textContent = time;
     row.insertCell(2).textContent = amount;
     row.insertCell(3).textContent = countryName;
     row.insertCell(4).textContent = countryCode;
 }
 
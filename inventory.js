import { supabase } from './supabase.js';

const form = document.getElementById('inventory-form');
const tableBody = document.getElementById('inventory-table');
const filterInput = document.getElementById('filter');
const logoutBtn = document.getElementById('logout');

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ----------------- LOGOUT -----------------
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
  });
}

// ----------------- LOAD INVENTORY -----------------
async function loadInventory(filter = '') {
  tableBody.innerHTML = '';
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const { data: items, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    alert('Greška pri učitavanju inventara: ' + error.message);
    return;
  }

  const list = items || [];
  const filtered = filter
    ? list.filter(item => (item.name || '').toLowerCase().includes(filter.toLowerCase()))
    : list;

  filtered.forEach(item => {
    const row = document.createElement('tr');

    const expiryValue = item.expiry ? item.expiry.split('T')[0] : '';

    row.innerHTML = `
      <td><input type="text" value="${escapeHtml(item.name)}" disabled></td>
      <td><input type="number" value="${escapeHtml(item.quantity)}" min="0" disabled></td>
      <td><input type="date" value="${escapeHtml(expiryValue)}" disabled></td>
      <td><input type="text" value="${escapeHtml(item.notes || '')}" disabled></td>
      <td>
        <button class="edit-btn">Uredi</button>
        <button class="delete-btn">Obriši</button>
      </td>
    `;

    const diffDays = item.expiry ? Math.ceil((new Date(item.expiry) - new Date()) / (1000*60*60*24)) : Infinity;
    if (diffDays <= 7) row.classList.add('expiring');
    else row.classList.add('normal');

    tableBody.appendChild(row);

    const infoRow = document.createElement('tr');
    infoRow.className = 'edited-info';
    infoRow.innerHTML = `
      <td colspan="5">
        Poslednja izmena: ${item.updated_at ? new Date(item.updated_at).toLocaleString() : 'Nije menjano'}
      </td>
    `;
    tableBody.appendChild(infoRow);

    const editBtn = row.querySelector('.edit-btn');
    editBtn.addEventListener('click', async () => {
      const inputs = row.querySelectorAll('input');

      if (editBtn.textContent === 'Uredi') {
        inputs.forEach(i => i.disabled = false);
        editBtn.textContent = 'Sačuvaj';
      } else {
        const updatedData = {
          name: inputs[0].value,
          quantity: parseInt(inputs[1].value) || 0,
          expiry: inputs[2].value || null,
          notes: inputs[3].value,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('inventory')
          .update(updatedData)
          .eq('id', item.id);

        if (error) {
          alert('Greška pri čuvanju: ' + error.message);
        } else {
          inputs.forEach(i => i.disabled = true);
          editBtn.textContent = 'Uredi';
          infoRow.querySelector('td').textContent = 'Poslednja izmena: ' + new Date().toLocaleString();

          const newDiffDays = updatedData.expiry ? Math.ceil((new Date(updatedData.expiry) - new Date()) / (1000*60*60*24)) : Infinity;
          if (newDiffDays <= 7) {
            row.classList.add('expiring');
            row.classList.remove('normal');
          } else {
            row.classList.add('normal');
            row.classList.remove('expiring');
          }
        }
      }
    });

    const deleteBtn = row.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Da li ste sigurni da želite da obrišete ovaj lek?')) {
        const { error } = await supabase
          .from('inventory')
          .delete()
          .eq('id', item.id);
        if (error) {
          alert('Greška pri brisanju: ' + error.message);
        } else {
          row.remove();
          infoRow.remove();
        }
      }
    });
  });
}

// ----------------- ADD ITEM -----------------
const addBtn = document.getElementById('add-item');
if (addBtn) {
  addBtn.addEventListener('click', async () => {
    const name = document.getElementById('name').value.trim();
    const quantityRaw = document.getElementById('quantity').value;
    const quantity = parseInt(quantityRaw, 10);
    const expiry = document.getElementById('expiry').value || null;
    const notes = document.getElementById('notes').value;

    if (!name) return alert('Unesite naziv leka.');
    if (isNaN(quantity) || quantity < 0) return alert('Unesite ispravnu količinu.');

    addBtn.disabled = true;
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return alert('Niste prijavljeni');

      const { error } = await supabase.from('inventory').insert([{
        name, quantity, expiry, notes, user_id: user.id
      }]);

      if (error) {
        alert('Greška pri dodavanju leka: ' + error.message);
      } else {
        form.reset();
        loadInventory();
      }
    } finally {
      addBtn.disabled = false;
    }
  });
}

// ----------------- FILTER (debounced) -----------------
let filterTimeout = null;
if (filterInput) {
  filterInput.addEventListener('input', (e) => {
    clearTimeout(filterTimeout);
    const val = e.target.value;
    filterTimeout = setTimeout(() => loadInventory(val), 300);
  });
}

// ----------------- INIT -----------------
loadInventory();

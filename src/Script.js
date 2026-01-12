// ATENÇÃO: Substitua pelo seu link que termina em output=csv
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQUKfKP7MueT-AwoBMgx_giYuhM7mYUnursY-G669w78hncLqlZM0RC9z7PoWUUTBgo3KNc6hL757kD/pub?output=csv'; 

let inventory = [];

// Nomes personalizados das lojas conforme solicitado
const nomesLojas = [
    "Quixadá",
    "Fortaleza",
    "Iguatu Loja 1",
    "Iguatu Loja 2",
    "Limoeiro",
    "Maranguape"
];

async function loadData() {
    const status = document.getElementById('statusIndicator');
    if(status) {
        status.innerText = "Sincronizando...";
        status.style.background = "#fff3e0";
    }
    
    try {
        const response = await fetch(SHEET_URL);
        const data = await response.text();
        
        // Verifica se o link retornou HTML (erro) em vez de CSV
        if (data.includes('<html')) {
            if(status) status.innerText = "Erro: Link inválido";
            return;
        }

        const lines = data.split(/\r?\n/).filter(line => line.trim() !== "");
        const sep = lines[0].includes(';') ? ';' : ',';

        inventory = lines.slice(1).map(line => {
            // Divide as colunas respeitando aspas
            const cols = line.split(sep).map(c => c.replace(/^"|"$/g, '').trim());
            
            // Mapeamento das colunas: 
            // 0:Img, 1:Cod, 2:Banho, 3:Nome, 4:Quixadá, 5:Fortaleza, 6:Iguatu1, 7:Iguatu2, 8:Limoeiro, 9:Maranguape
            const estoqueLojas = [
                Number(cols[4] || 0), Number(cols[5] || 0), Number(cols[6] || 0),
                Number(cols[7] || 0), Number(cols[8] || 0), Number(cols[9] || 0)
            ];
            
            const total = estoqueLojas.reduce((a, b) => a + b, 0);

            return {
                imagem: fixDriveLink(cols[0]),
                codigo: cols[1] || '---',
                banho: cols[2] || '---',
                nome: cols[3] || 'Sem Nome',
                lojas: estoqueLojas,
                total: total
            };
        }).filter(item => item.nome && item.nome !== 'Sem Nome');

        render(inventory);
        
        if(status) {
            status.innerText = "Sincronizado";
            status.style.background = "#e8f5e9";
        }
    } catch (err) {
        console.error("Erro ao carregar dados:", err);
        if(status) status.innerText = "Erro na conexão";
    }
}

// Melhor função para exibir imagens do Drive em 2024
function fixDriveLink(url) {
    if (!url || !url.includes('drive.google.com')) return url;
    const match = url.match(/\/d\/(.+?)\/|id=(.+?)(&|$)/);
    const id = match ? (match[1] || match[2]) : null;
    return id ? `https://lh3.googleusercontent.com/d/${id}=s1000` : url;
}

function render(items) {
    const catalog = document.getElementById('catalog');
    if(!catalog) return;

    catalog.innerHTML = items.map((item, index) => `
        <div class="card" onclick="toggleDetails(${index})">
            <div class="card-img-wrapper">
                <img src="${item.imagem}" loading="lazy" onerror="this.src='https://via.placeholder.com/300/D3BCA5/FFFFFF?text=Sem+Foto'">
                <div class="badge-total">Estoque Total: ${item.total}</div>
            </div>
            <div class="card-content">
                <span class="code-tag">REF: ${item.codigo}</span>
                <strong class="product-name">${item.nome}</strong>
                <div class="bath-info">Banho: ${item.banho}</div>
                
                <div id="details-${index}" class="store-details">
                    <div class="store-title">Distribuição por Unidade:</div>
                    <div class="store-grid">
                        ${item.lojas.map((qtd, i) => `
                            <div class="store-item ${qtd > 0 ? 'has-stock' : 'no-stock'}">
                                <span class="store-name">${nomesLojas[i]}</span>
                                <span class="store-qty">${qtd}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleDetails(index) {
    const el = document.getElementById(`details-${index}`);
    if(el) el.classList.toggle('active');
}

// Busca em tempo real
const searchBar = document.getElementById('searchBar');
if(searchBar) {
    searchBar.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = inventory.filter(i => 
            i.nome.toLowerCase().includes(term) || 
            i.codigo.toLowerCase().includes(term)
        );
        render(filtered);
    });
}

// Inicia a carga
loadData();
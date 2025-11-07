const JSON_URL = 'https://script.google.com/macros/s/AKfycbzX05lTnpeKf4xzjlT7NCEIv5ofH5j7MlRYpvF-4-WpmJBHmg0UpHBkhjxM22JfU3ZgTw/exec';
let allData = []; // 全データを保持するグローバル変数

// データを取得し、整形する関数
async function fetchData() {
    try {
        const response = await fetch(JSON_URL);
        const json = await response.json();
        
        // Google Sheets APIのJSON構造は複雑なので、必要なデータのみを抽出
        // 'gsx$'の後にスプレッドシートの列名（小文字、スペースなし）が続きます
        allData = json.feed.entry.map(item => ({
            word: item.gsx$単語.$t,
            meaning: item.gsx$意味.$t,
            stem: item.gsx$基幹.$t,
            prefix: item.gsx$接頭辞.$t,
            // 必要に応じて他の列も追加...
            prefixMeaning: item.gsx$接頭辞基本意味.$t,
            example1: item.gsx$例文1.$t
        }));

        initializePage();

    } catch (error) {
        console.error("データの取得中にエラーが発生しました:", error);
        document.getElementById('main-content').innerHTML = '<p>データの読み込みに失敗しました。スプレッドシートの公開設定を確認してください。</p>';
    }
}

// フィルタリングリスト（接頭辞と基幹）を初期化する
function initializePage() {
    // 固有の接頭辞と基幹のリストを作成
    const prefixes = [...new Set(allData.map(item => item.prefix))].sort();
    const stems = [...new Set(allData.map(item => item.stem))].sort();

    renderFilterList('prefix-list', prefixes, 'prefix');
    renderFilterList('stem-list', stems, 'stem');

    // 初期表示として全動詞を表示
    renderVerbDetails(allData);
}

// フィルタリングリスト（UL要素）をHTMLに描画する
function renderFilterList(elementId, items, type) {
    const listElement = document.getElementById(elementId);
    listElement.innerHTML = '';
    
    // 全て表示リンクを追加
    const allItem = document.createElement('li');
    allItem.innerHTML = `<a href="#" data-filter-value="all" data-filter-type="${type}">**全て表示**</a>`;
    allItem.querySelector('a').addEventListener('click', (e) => filterData(e, type));
    listElement.appendChild(allItem);
    
    // 各接頭辞/基幹のリンクを追加
    items.forEach(item => {
        const listItem = document.createElement('li');
        // クリック時にfilterData関数を呼び出す
        listItem.innerHTML = `<a href="#" data-filter-value="${item}" data-filter-type="${type}">${item}</a>`;
        listItem.querySelector('a').addEventListener('click', (e) => filterData(e, type));
        listElement.appendChild(listItem);
    });
}

// フィルタリングを実行し、結果をメインコンテンツに表示する
function filterData(e, type) {
    e.preventDefault(); // リンクのデフォルト動作（ページ遷移）をキャンセル
    const filterValue = e.target.getAttribute('data-filter-value');
    
    let filteredData;
    
    if (filterValue === 'all') {
        // 「全て表示」の場合
        filteredData = allData;
        document.getElementById('main-content').querySelector('h2').textContent = `単語一覧（${type === 'prefix' ? '接頭辞' : '基幹'}：全て）`;
    } else if (type === 'prefix') {
        // 接頭辞でフィルタリング
        filteredData = allData.filter(item => item.prefix === filterValue);
        document.getElementById('main-content').querySelector('h2').textContent = `単語一覧（接頭辞：${filterValue}）`;
    } else if (type === 'stem') {
        // 基幹でフィルタリング
        filteredData = allData.filter(item => item.stem === filterValue);
        document.getElementById('main-content').querySelector('h2').textContent = `単語一覧（基幹：${filterValue}）`;
    }
    
    // フィルタリングされたデータを表示
    renderVerbDetails(filteredData);
    
    // 選択された要素をハイライト（CSS処理用）
    document.querySelectorAll('.filter-list a').forEach(a => a.classList.remove('active'));
    e.target.classList.add('active');
}

// 動詞の詳細リストをHTMLに描画する
function renderVerbDetails(data) {
    const detailsElement = document.getElementById('verb-details');
    detailsElement.innerHTML = ''; // 一旦クリア
    
    if (data.length === 0) {
        detailsElement.innerHTML = '<p>該当する単語は見つかりませんでした。</p>';
        return;
    }

    // 取得したデータを行ごとに表示
    data.forEach(item => {
        const verbCard = document.createElement('div');
        verbCard.classList.add('verb-card');
        
        verbCard.innerHTML = `
            <h3>${item.word}</h3>
            <p><strong>意味:</strong> ${item.meaning}</p>
            <p><strong>基幹:</strong> ${item.stem}</p>
            <p><strong>接頭辞:</strong> ${item.prefix} (${item.prefixMeaning})</p>
            <p><strong>例文:</strong> ${item.example1}</p>
            <hr>
        `;
        detailsElement.appendChild(verbCard);
    });
}

// ページのロード時にデータ取得を開始
fetchData();

const JSON_URL = 'https://script.google.com/macros/s/AKfycbynlFiThdK8QwcmIm6ZsMssBtNaKrpFN64zDlkRXyTdii3K7ucvEwWocW5BrcczjvC2IA/exec';
let allData = []; // 全データを保持するグローバル変数

// script.js の fetchData 関数 (修正版)

// データを取得し、整形する関数
async function fetchData() {
    try {
        const response = await fetch(JSON_URL, {
            // ⭐ 以下のオプションを追加: これによりCORSエラーを回避します
            mode: 'no-cors' 
        });
        
        // no-corsモードでは、レスポンスが不透明（opaque）になるため、
        // response.json() を直接呼び出すことができません。
        // 代わりに、JSONPや他の方法を検討する必要があります。

        // **しかし、簡単なfetchでは解決できないため、ここで方法を切り替えます。**
        
        // ⭐⭐ JSONPの回避策として、外部プロキシサービスを利用します ⭐⭐
        // この方法が最も確実ですが、外部サービスへの依存が発生します。

        // ウェブページ側で、以下のURL形式に変更してデータを取得します。
        // （JSON_URLは、GASのウェブアプリURLのままです）

        // プロキシサービス (例: allorigins.win) を使ってCORSを回避し、JSONデータを取得
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(JSON_URL)}`;
        
        const proxyResponse = await fetch(proxyUrl);
        const data = await proxyResponse.json(); 
        
        allData = data.map(item => ({
            // キー名はスプレッドシートのヘッダーに一致させる
            word: item.単語,
            meaning: item.意味,
            stem: item.基幹,
            prefix: item.接頭辞,
            prefixMeaning: item.接頭辞基本意味,
            example1: item.例文1
            // ... 他のデータも同様に
        }));

        initializePage();

    } catch (error) {
        console.error("データの取得中にエラーが発生しました。外部プロキシまたはGASの設定を確認してください:", error);
        document.getElementById('main-content').innerHTML = '<p>データの読み込みに失敗しました。GASのURL、権限、デプロイ状態を再度確認してください。</p>';
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

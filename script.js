const JSON_URL = 'https://script.google.com/macros/s/AKfycbynlFiThdK8QwcmIm6ZsMssBtNaKrpFN64zDlkRXyTdii3K7ucvEwWocW5BrcczjvC2IA/exec';
let allData = []; // 全データを保持するグローバル変数

// データを取得し、整形する関数
async function fetchData() {
    try {
        // GASのウェブアプリURLを外部プロキシサービスを使ってラップし、CORSエラーを回避します。
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(JSON_URL)}`;
        
        const proxyResponse = await fetch(proxyUrl);
        // プロキシサービスがJSONを返すため、response.json()で直接データを取得
        const data = await proxyResponse.json(); 
        
        // JSONデータから必要な情報を抽出・マッピング
        allData = data.map(item => ({
            // JSONのキー（item.単語など）は、スプレッドシートの1行目のヘッダーと完全に一致しています。
            word: item.単語,
            meaning: item.意味,
            stem: item.基幹,
            prefix: item.接頭辞,
            englishTranslation: item.英訳,
            prefixMeaning: item.接頭辞基本意味,
            nuance: item.語感,
            syntax: item.構文,
            separability: item.分離性,
            conjugation: item.活用,
            example1: item.例文1,
            japaneseTranslation1: item.日本語訳1,
            example2: item.例文2,
            japaneseTranslation2: item.日本語訳2,
            derivatives: item.派生語,
            correspondingEnglish: item.対応英単語
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
    const allText = type === 'prefix' ? '全ての接頭辞' : '全ての基幹';
    allItem.innerHTML = `<a href="#" data-filter-value="all" data-filter-type="${type}">**${allText}**</a>`;
    allItem.querySelector('a').addEventListener('click', (e) => filterData(e, type));
    listElement.appendChild(allItem);
    
    // 各接頭辞/基幹のリンクを追加
    items.forEach(item => {
        // 空の項目は表示しない
        if (!item || item.length === 0) return;
        
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

// script.js 内の renderVerbDetails 関数 (最終修正版)
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
        
        // 例文 2 の HTML 部分を変数として定義 (構文エラー回避のため)
        let example2Html = '';
        if (item.example2) {
            example2Html = `
                <h4>例文 2</h4>
                <blockquote>
                    ${item.example2}<br>
                    <em>${item.japaneseTranslation2 || '---'}</em>
                </blockquote>
            `;
        }

        // 全ての項目を表示するように拡張
        verbCard.innerHTML = `
            <h3>${item.word} (${item.englishTranslation || '---'})</h3>
            <p><strong>意味:</strong> ${item.meaning}</p>
            <p><strong>基幹:</strong> ${item.stem}</p>
            <p><strong>接頭辞:</strong> ${item.prefix} (${item.prefixMeaning || '---'})</p>
            
            <div style="margin-top: 10px; padding: 10px; background-color: #f0f0f0; border-radius: 4px;">
                <p><strong>語感:</strong> ${item.nuance || '---'}</p>
                <p><strong>構文/分離性/活用:</strong> ${item.syntax || '---'} / ${item.separability || '---'} / ${item.conjugation || '---'}</p>
            </div>
            
            <h4>例文 1</h4>
            <blockquote>
                ${item.example1 || '---'}<br>
                <em>${item.japaneseTranslation1 || '---'}</em>
            </blockquote>
            
            ${example2Html} <p><strong>派生語:</strong> ${item.derivatives || '---'}</p>
            <p><strong>対応英単語:</strong> ${item.correspondingEnglish || '---'}</p>
            <hr>
        `;
        detailsElement.appendChild(verbCard);
    });
}

// ページのロード時にデータ取得を開始
fetchData();

import requests, json, os

NOTION_TOKEN = os.environ["NOTION_TOKEN"]
DATABASE_ID = os.environ["NOTION_DATABASE_ID"]

url = f"https://api.notion.com/v1/databases/{DATABASE_ID}/query"
headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28"
}

res = requests.post(url, headers=headers)
data = res.json()

def get_text(prop):
    if not prop:
        return ""
    if "title" in prop:
        return "".join([t["plain_text"] for t in prop["title"]])
    if "rich_text" in prop:
        return "".join([t["plain_text"] for t in prop["rich_text"]])
    if "select" in prop and prop["select"]:
        return prop["select"]["name"]
    return ""

processed = []
for page in data["results"]:
    props = page["properties"]
    processed.append({
        "単語": get_text(props.get("単語")),
        "意味": get_text(props.get("意味")),
        "基幹": get_text(props.get("基幹")),
        "接頭辞": get_text(props.get("接頭辞")),
        "英訳": get_text(props.get("英訳")),
        "接頭辞基本意味": get_text(props.get("接頭辞基本意味")),
        "語感": get_text(props.get("語感")),
        "構文": get_text(props.get("構文")),
        "分離性": get_text(props.get("分離性")),
        "活用": get_text(props.get("活用")),
        "例文1": get_text(props.get("例文1")),
        "日本語訳1": get_text(props.get("日本語訳1")),
        "例文2": get_text(props.get("例文2")),
        "日本語訳2": get_text(props.get("日本語訳2")),
        "派生語": get_text(props.get("派生語")),
        "対応英単語": get_text(props.get("対応英単語"))
    })

with open("verbs.json", "w", encoding="utf-8") as f:
    json.dump(processed, f, ensure_ascii=False, indent=2)

print(f"✅ Exported {len(processed)} records to verbs.json")

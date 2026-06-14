// 직구 계산기 → 노션 저장 함수
// 앱의 '노션에 저장' 버튼이 이 함수를 호출하고, 이 함수가 노션에 페이지를 만듭니다.
// 비밀키(NOTION_TOKEN)는 Netlify 환경변수에 넣어두므로 화면에 노출되지 않습니다.

exports.handler = async (event) => {
  // POST 요청만 허용
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "POST만 가능합니다." }) };
  }

  const TOKEN = process.env.NOTION_TOKEN;
  // DB ID는 기본값을 넣어두되, 환경변수로 바꿀 수 있게 함
  const DB_ID = process.env.NOTION_DB_ID || "0383dcc18a53460e9fd306c5afbc02d1";

  if (!TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "NOTION_TOKEN 환경변수가 없습니다." }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "데이터 형식 오류" }) };
  }

  // 노션 속성 타입별 분류 (노션 DB 컬럼명과 정확히 일치해야 함)
  const TEXT_FIELDS = ["국가", "주문사이트", "메모"];
  const SELECT_FIELDS = ["배송방식", "통화", "판매타입"];
  const NUMBER_FIELDS = [
    "구매가(외화)", "구매가(원화)", "환율", "수량", "개당운임",
    "판매총원가", "마진율", "권장판매가", "개당순이익",
    "네이버단가", "네이버세트가", "네이버총이익",
    "단품마진", "단품마진율", "세트마진", "세트마진율"
  ];

  const props = {};

  // 제목(제품명)은 필수
  props["제품명"] = { title: [{ text: { content: String(data["제품명"] || "이름 없음") } }] };

  for (const k of TEXT_FIELDS) {
    if (data[k]) props[k] = { rich_text: [{ text: { content: String(data[k]) } }] };
  }
  for (const k of SELECT_FIELDS) {
    if (data[k]) props[k] = { select: { name: String(data[k]) } };
  }
  for (const k of NUMBER_FIELDS) {
    const v = data[k];
    if (v !== undefined && v !== null && v !== "") props[k] = { number: Number(v) };
  }
  if (data["저장일"]) {
    props["저장일"] = { date: { start: String(data["저장일"]) } };
  }

  // 노션 API 호출
  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + TOKEN,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
      },
      body: JSON.stringify({
        parent: { database_id: DB_ID },
        properties: props
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: 502, body: JSON.stringify({ error: "노션 저장 실패", detail: errText }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "서버 오류", detail: String(e) }) };
  }
};

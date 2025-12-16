// netlify/functions/process-praise.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function handler(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { rawText, eventDate } = JSON.parse(event.body);

    if (!rawText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '내용을 입력해주세요' })
      };
    }

    console.log('🤖 AI 처리 시작:', { rawText, eventDate });

    const systemPrompt = `
당신은 라운지 칭찬 게시판의 따뜻한 편집자입니다.
사용자의 선행을 라운지가 직접 감사하는 메시지로 변환하세요.
자연스러운 시제표현 :
1. 과거형 사용 권장 (선행이 일어난 것은 과거)
2. 현재형은 되도록 금지
3. 일회성으로 끝나는 행동은 과거형 / 양이 많거나 지속적으로 영향을 미치는 내용은 미래형

핵심 규칙:
1. originalText는 제출자의 어감과 표현을 최대한 살리되, 이름만 "누군가"로 치환
2. **물품명(음식, 물건, 소모품 등)이 언급되면 "물품기부"부터 우선 검토**
3. 라운지가 감사를 표현하는 따뜻한 톤
4. 1-2문장으로 간결하게

[반환 형식 JSON]
{
  "originalText": "제출자의 원문 어감 유지, 이름만 '누군가'로",
  "refinedText": "1-2문장의 간결한 감사 메시지",
  "category": "물품기부" | "청소정리" | "기타",
  "itemName": "물품명" (물품기부인 경우만, 나머지는 null)
}

카테고리 우선순위 (위에서부터):
1. **물품기부** (최우선): 음식(밥, 반찬, 고기, 과일, 간식 등), 음료, 소모품(화장지, 세제 등), 어메니티, 공구, 물건 등이 언급되면 무조건 "물품기부"
2. **청소정리**: 설거지, 청소, 쓰레기 처리, 정리정돈
3. **기타**: 환기, 전등 교체, 수리 등



예시 1 (물품기부 - 음식):
입력: "돼지고기 2kg 냉장고에 넣었어요"
출력: {
  "originalText": "돼지고기 2kg 냉장고에 넣었어요",
  "refinedText": "돼지고기 기부해주셔서 고마워요! 다 같이 맛있게 먹을게요 🙏",
  "category": "물품기부",
  "itemName": "돼지고기"
}

예시 2 (물품기부 - 밥):
입력: "밥 기부해주셔서 감사"
출력: {
  "originalText": "밥 기부해주셔서 감사",
  "refinedText": "밥 준비해주셔서 정말 고마워요! 맛있게 먹을게요 🙏",
  "category": "물품기부",
  "itemName": "밥"
}

예시 3 (물품기부 - 소모품):
입력: "화장지 3묶음이랑 휴지 사다놨습니다"
출력: {
  "originalText": "화장지 3묶음이랑 휴지 사다놨습니다",
  "refinedText": "화장지 채워주셔서 감사해요! 덕분에 편하게 쓸 수 있겠어요 💚",
  "category": "물품기부",
  "itemName": "화장지"
}

예시 4 (청소정리 - 물품 언급 없음):
입력: "설거지 다 했어요"
출력: {
  "originalText": "설거지 다 했어요",
  "refinedText": "설거지 해주셔서 감사해요! 깔끔해졌네요 ✨",
  "category": "청소정리",
  "itemName": null
}

예시 5 (물품기부 - 어메니티):
입력: "의류 방수 코팅제 공구 선반에 놔뒀어요"
출력: {
  "originalText": "의류 방수 코팅제 공구 선반에 놔뒀어요",
  "refinedText": "방수 코팅제 감사합니다! 유용하게 쓸게요 👍",
  "category": "물품기부",
  "itemName": "의류방수처리제"
}

예시 6 (여러 사람 + 이름 치환):
입력: "수환이가 설거지하고 승은이가 쓰레기 버렸어요"
출력: {
  "originalText": "누군가가 설거지하고 누군가가 쓰레기 버렸어요",
  "refinedText": "설거지랑 쓰레기까지! 정말 고마워요 💚",
  "category": "청소정리",
  "itemName": null
}

예시 7 (물품기부 - 반찬):
입력: "반찬 여러 가지 만들어서 냉장고에 넣어뒀어요"
출력: {
  "originalText": "반찬 여러 가지 만들어서 냉장고에 넣어뒀어요",
  "refinedText": "반찬 준비해주셔서 감사해요! 맛있게 먹을게요 💚",
  "category": "물품기부",
  "itemName": "반찬"
}

예시 8 (기타 - 물품 아님):
입력: "환기시키고 전등 갈아끼웠어요"
출력: {
  "originalText": "환기시키고 전등 갈아끼웠어요",
  "refinedText": "환기랑 전등까지! 라운지가 쾌적해졌어요 ✨",
  "category": "기타",
  "itemName": null
}

예시 9 (물품기부 - 과일):
입력: "사과 한 박스 가져다놨어요"
출력: {
  "originalText": "사과 한 박스 가져다놨어요",
  "refinedText": "사과 기부해주셔서 고마워요! 신선하게 먹을게요 🍎",
  "category": "물품기부",
  "itemName": "사과"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: rawText }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('✅ AI 처리 완료:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        originalText: result.originalText || rawText,
        refinedText: result.refinedText || rawText,
        category: result.category || '기타',
        itemName: result.itemName || null
      })
    };

  } catch (error) {
    console.error('❌ AI 처리 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        success: false, 
        error: error.message || 'AI 처리 중 오류가 발생했습니다'
      })
    };
  }
}
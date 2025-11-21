from fastapi import APIRouter, HTTPException
import httpx

from app.schemas.schemas import DictionaryResponse

router = APIRouter()

FREE_DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en"


@router.get("/{word}", response_model=DictionaryResponse)
async def lookup_word(word: str):
    """查询单词释义（代理 Free Dictionary API）"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{FREE_DICTIONARY_API}/{word}", timeout=10.0)

            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Word not found")

            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Dictionary API error")

            data = response.json()
            if not data or not isinstance(data, list):
                raise HTTPException(status_code=404, detail="Word not found")

            entry = data[0]

            # 提取音标
            phonetic = entry.get("phonetic", "")
            if not phonetic and entry.get("phonetics"):
                for p in entry["phonetics"]:
                    if p.get("text"):
                        phonetic = p["text"]
                        break

            # 提取音频
            audio = None
            if entry.get("phonetics"):
                for p in entry["phonetics"]:
                    if p.get("audio"):
                        audio = p["audio"]
                        break

            # 提取释义
            meanings = []
            for meaning in entry.get("meanings", []):
                part_of_speech = meaning.get("partOfSpeech", "")
                definitions = []
                for d in meaning.get("definitions", [])[:3]:  # 每个词性最多3个释义
                    definitions.append({
                        "definition": d.get("definition", ""),
                        "example": d.get("example", "")
                    })
                meanings.append({
                    "partOfSpeech": part_of_speech,
                    "definitions": definitions
                })

            return DictionaryResponse(
                word=word,
                phonetic=phonetic,
                meanings=meanings,
                audio=audio
            )

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="Dictionary API timeout")
        except httpx.RequestError as e:
            raise HTTPException(status_code=502, detail=f"Request error: {str(e)}")

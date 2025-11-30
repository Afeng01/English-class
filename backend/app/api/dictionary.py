from fastapi import APIRouter, HTTPException
import asyncio
import httpx
import os
import hashlib
import time
import uuid
import json
import re
from datetime import datetime, timedelta
from typing import Optional, Dict
from nltk.stem import WordNetLemmatizer
from nltk.corpus import wordnet
from functools import lru_cache

from app.schemas.schemas import DictionaryResponse

router = APIRouter()

# ==================== 有道词典API配置 ====================
# 申请地址：https://ai.youdao.com/
YOUDAO_APP_KEY = os.getenv("YOUDAO_APP_KEY", "")
YOUDAO_APP_SECRET = os.getenv("YOUDAO_APP_SECRET", "")
YOUDAO_DICT_API = "https://openapi.youdao.com/api"

# ==================== 缓存配置 ====================
# 词典查询结果缓存（内存缓存，服务重启后清空）
_dictionary_cache: Dict[str, tuple[dict, float]] = {}
CACHE_EXPIRE_HOURS = 24  # 缓存24小时

# 初始化词形还原器
lemmatizer = WordNetLemmatizer()
PUNCTUATION_MARKS = set(",.;!?，。！？；：、“”\"'()")
EXPLAIN_SPLIT_PATTERN = re.compile(r'[；;，、]+')


# ==================== 缓存辅助函数 ====================
def get_from_cache(word: str) -> Optional[dict]:
    """从缓存中获取词典结果"""
    word_lower = word.lower()
    if word_lower in _dictionary_cache:
        result, expire_time = _dictionary_cache[word_lower]
        if datetime.now().timestamp() < expire_time:
            return result
        else:
            del _dictionary_cache[word_lower]
    return None


def is_phrase_or_sentence(text: str) -> bool:
    """简单判断查询是否为短语/句子（包含空格或标点）"""
    stripped = text.strip()
    if not stripped:
        return False
    if any(ch.isspace() for ch in stripped):
        return True
    return any(ch in PUNCTUATION_MARKS for ch in stripped)


def save_to_cache(word: str, result: dict):
    """保存词典结果到缓存"""
    word_lower = word.lower()
    expire_time = (datetime.now() + timedelta(hours=CACHE_EXPIRE_HOURS)).timestamp()
    _dictionary_cache[word_lower] = (result, expire_time)


# ==================== 词形还原 ====================
# 不规则动词映射（NLTK处理不好的情况）
IRREGULAR_VERBS = {
    "was": "be", "were": "be", "been": "be", "am": "be", "is": "be", "are": "be",
    "had": "have", "has": "have",
    "did": "do", "does": "do", "done": "do",
    "went": "go", "gone": "go", "goes": "go",
    "said": "say", "says": "say",
    "made": "make", "makes": "make",
    "knew": "know", "known": "know", "knows": "know",
    "thought": "think", "thinks": "think",
    "took": "take", "taken": "take", "takes": "take",
    "saw": "see", "seen": "see", "sees": "see",
    "came": "come", "comes": "come",
    "gave": "give", "given": "give", "gives": "give",
    "got": "get", "gotten": "get", "gets": "get",
    "found": "find", "finds": "find",
    "told": "tell", "tells": "tell",
    "felt": "feel", "feels": "feel",
    "became": "become", "becomes": "become",
    "left": "leave", "leaves": "leave",
    "brought": "bring", "brings": "bring",
    "began": "begin", "begun": "begin", "begins": "begin",
    "kept": "keep", "keeps": "keep",
    "held": "hold", "holds": "hold",
    "wrote": "write", "written": "write", "writes": "write",
    "stood": "stand", "stands": "stand",
    "heard": "hear", "hears": "hear",
    "let": "let", "lets": "let",
    "meant": "mean", "means": "mean",
    "set": "set", "sets": "set",
    "met": "meet", "meets": "meet",
    "ran": "run", "runs": "run",
    "paid": "pay", "pays": "pay",
    "sat": "sit", "sits": "sit",
    "spoke": "speak", "spoken": "speak", "speaks": "speak",
    "lay": "lie", "lain": "lie", "lies": "lie",
    "led": "lead", "leads": "lead",
    "read": "read", "reads": "read",
    "grew": "grow", "grown": "grow", "grows": "grow",
    "lost": "lose", "loses": "lose",
    "fell": "fall", "fallen": "fall", "falls": "fall",
    "sent": "send", "sends": "send",
    "built": "build", "builds": "build",
    "spent": "spend", "spends": "spend",
    "won": "win", "wins": "win",
    "caught": "catch", "catches": "catch",
    "taught": "teach", "teaches": "teach",
    "bought": "buy", "buys": "buy",
    "wore": "wear", "worn": "wear", "wears": "wear",
    "chose": "choose", "chosen": "choose", "chooses": "choose",
    "broke": "break", "broken": "break", "breaks": "break",
    "drove": "drive", "driven": "drive", "drives": "drive",
    "ate": "eat", "eaten": "eat", "eats": "eat",
    "drew": "draw", "drawn": "draw", "draws": "draw",
    "flew": "fly", "flown": "fly", "flies": "fly",
    "threw": "throw", "thrown": "throw", "throws": "throw",
    "children": "child",
    "men": "man",
    "women": "woman",
    "feet": "foot",
    "teeth": "tooth",
    "mice": "mouse",
    "geese": "goose",
    "people": "person",
}


@lru_cache(maxsize=1000)
def lemmatize_word(word: str) -> str:
    """词形还原：将词形变化还原为原形

    例如：running → run, went → go, children → child
    """
    word_lower = word.lower()

    # 1. 首先检查不规则动词映射
    if word_lower in IRREGULAR_VERBS:
        return IRREGULAR_VERBS[word_lower]

    # 2. 使用WordNet进行还原
    pos_list = [wordnet.VERB, wordnet.NOUN, wordnet.ADJ, wordnet.ADV]
    results = set()

    for pos in pos_list:
        lemma = lemmatizer.lemmatize(word_lower, pos=pos)
        if lemma != word_lower:
            results.add(lemma)

    # 如果有还原结果，优先返回最短的结果
    if results:
        return min(results, key=len)

    # 无法还原则返回原词小写
    return word_lower


# ==================== 有道词典API ====================
def truncate(q: str) -> str:
    """截断文本（有道API签名要求）

    如果文本长度 ≤ 20，直接返回
    如果文本长度 > 20，返回：前10个字符 + 长度 + 后10个字符
    """
    if q is None:
        return None
    size = len(q)
    return q if size <= 20 else q[0:10] + str(size) + q[size - 10:size]


async def query_free_dictionary(client: httpx.AsyncClient, word: str) -> Optional[dict]:
    """查询 Free Dictionary API（英文词典，免费）"""
    start_time = time.time()
    try:
        url = f"https://api.dictionaryapi.dev/api/v2/entries/en/{word.lower()}"
        response = await client.get(url, timeout=2.0)

        if response.status_code != 200:
            elapsed = (time.time() - start_time) * 1000
            print(f"❌ Free Dictionary HTTP错误 {response.status_code}: {word} ({elapsed:.0f}ms)")
            return None

        data = response.json()
        if not data or not isinstance(data, list) or len(data) == 0:
            elapsed = (time.time() - start_time) * 1000
            print(f"ℹ️ Free Dictionary无结果: {word} ({elapsed:.0f}ms)")
            return None

        entry = data[0]

        phonetic = entry.get('phonetic', '')
        if not phonetic and 'phonetics' in entry:
            for p in entry.get('phonetics', []):
                if p.get('text'):
                    phonetic = p['text']
                    break

        meanings = []
        for meaning in entry.get('meanings', []):
            part_of_speech = meaning.get('partOfSpeech', '')
            definitions = []

            for definition in meaning.get('definitions', []):
                definitions.append({
                    "definition": definition.get('definition', ''),
                    "example": definition.get('example', '')
                })

            if definitions:
                meanings.append({
                    "partOfSpeech": part_of_speech,
                    "definitions": definitions,
                    "lang": "en"
                })

        if not meanings:
            elapsed = (time.time() - start_time) * 1000
            print(f"ℹ️ Free Dictionary无释义: {word} ({elapsed:.0f}ms)")
            return None

        elapsed = (time.time() - start_time) * 1000
        print(f"✅ Free Dictionary返回 {len(meanings)} 个词性释义: {word} ({elapsed:.0f}ms)")
        return {
            "word": entry.get('word', word),
            "phonetic": phonetic,
            "meanings": meanings,
        }

    except httpx.TimeoutException:
        elapsed = (time.time() - start_time) * 1000
        print(f"⏱️ Free Dictionary超时: {word} ({elapsed:.0f}ms)")
        return None
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        print(f"Free Dictionary异常: {e} ({elapsed:.0f}ms)")
        return None


async def query_youdao_translate(client: httpx.AsyncClient, word: str) -> Optional[dict]:
    """查询有道翻译API（用于短语和句子的中文翻译）

    返回格式：
    {
        "word": "hello world",
        "phonetic": "",
        "meanings": [
            {
                "partOfSpeech": "",
                "definitions": [{"definition": "你好世界", "example": ""}]
            }
        ]
    }
    """
    # 检查API配置（包括检测占位符值）
    if not YOUDAO_APP_KEY or not YOUDAO_APP_SECRET or \
       YOUDAO_APP_KEY == "your_app_key_here" or \
       YOUDAO_APP_SECRET == "your_app_secret_here":
        print(f"⚠️  有道API未配置，跳过翻译")
        return None

    start_time = time.time()
    try:
        # 生成请求参数
        salt = str(uuid.uuid4())
        curtime = str(int(time.time()))
        q = word.lower()

        # 计算签名：sign = sha256(appKey + truncate(q) + salt + curtime + appSecret)
        # 注意：必须使用 truncate(q)，不能直接用 q
        sign_str = YOUDAO_APP_KEY + truncate(q) + salt + curtime + YOUDAO_APP_SECRET
        sign = hashlib.sha256(sign_str.encode('utf-8')).hexdigest()

        params = {
            'q': q,
            'from': 'en',
            'to': 'zh-CHS',
            'appKey': YOUDAO_APP_KEY,
            'salt': salt,
            'sign': sign,
            'signType': 'v3',
            'curtime': curtime,
        }

        response = await client.get(YOUDAO_DICT_API, params=params, timeout=3.0)

        if response.status_code != 200:
            elapsed = (time.time() - start_time) * 1000
            print(f"❌ 有道API HTTP错误: {response.status_code} ({elapsed:.0f}ms)")
            return None

        data = response.json()
        try:
            print("=" * 50)
            print(f"📥 有道API完整响应({word}):")
            print(json.dumps(data, ensure_ascii=False, indent=2))
            print("=" * 50)
        except Exception as log_error:
            print(f"⚠️ 有道API响应日志写入失败: {log_error}")

        # 检查错误码
        error_code = data.get('errorCode')
        if error_code != '0':
            elapsed = (time.time() - start_time) * 1000
            print(f"❌ 有道API错误码: {error_code} ({elapsed:.0f}ms)")
            # 常见错误码说明
            error_messages = {
                '101': '缺少必填的参数',
                '102': '不支持的语言类型',
                '103': '翻译文本过长',
                '108': '应用ID无效',
                '110': '无相关服务的有效实例',
                '111': '开发者账号无效',
                '113': 'q不能为空',
                '202': '签名检验失败',
                '401': '账户已经欠费',
                '411': '访问频率受限'
            }
            if error_code in error_messages:
                print(f"   {error_messages[error_code]}")
            return None

        # 解析有道词典响应
        basic = data.get('basic', {})
        translation = data.get('translation', [])
        print(f"📑 basic字段: {json.dumps(basic, ensure_ascii=False) if basic else '{}'}")
        print(f"🌐 web字段数量: {len(data.get('web', []) or [])}")
        print(f"🔁 translation字段: {json.dumps(translation, ensure_ascii=False)}")

        if not basic and not translation:
            return None

        # 构造meanings
        meanings = []

        # 从basic提取释义（不限制数量，显示全部）
        explains = basic.get('explains', [])
        if explains:
            for explain in explains:  # 显示全部释义
                text = explain.strip()
                part_of_speech = ""
                content = text
                if '.' in text:
                    prefix, rest = text.split('.', 1)
                    if len(prefix.strip()) <= 6:
                        part_of_speech = prefix.strip()
                        content = rest.strip()
                fragments = [frag.strip() for frag in EXPLAIN_SPLIT_PATTERN.split(content) if frag.strip()]
                if not fragments:
                    fragments = [content]
                meanings.append({
                    "partOfSpeech": part_of_speech,
                    "definitions": [{
                        "definition": fragment,
                        "example": ""
                    } for fragment in fragments],
                    "lang": "zh"  # 标记为中文翻译
                })

        # 补充机器翻译结果
        if translation:
            for trans in translation:
                if not trans:
                    continue
                meanings.append({
                    "partOfSpeech": "翻译",
                    "definitions": [{
                        "definition": trans,
                        "example": ""
                    }],
                    "lang": "zh"
                })

        # 解析 web 字段的网络释义（通常包含更口语化的翻译）
        web_entries = data.get('web', [])
        for entry in web_entries:
            values = entry.get('value', [])
            if not values:
                continue

            definitions = []
            for value in values:
                if not value:
                    continue
                definitions.append({
                    "definition": value,
                    "example": entry.get('key', "")
                })

            if definitions:
                meanings.append({
                    "partOfSpeech": "网络释义",
                    "definitions": definitions,
                    "lang": "zh"
                })

        # 解析词形变化
        wfs = basic.get('wfs', [])
        wf_definitions = []
        for wf_entry in wfs:
            wf = wf_entry.get('wf', {})
            value = wf.get('value')
            if not value:
                continue
            name = wf.get('name')
            label = f"{name or '词形'}: {value}"
            wf_definitions.append({
                "definition": label,
                "example": ""
            })
        if wf_definitions:
            meanings.append({
                "partOfSpeech": "词形变化",
                "definitions": wf_definitions,
                "lang": "zh"
            })

        # 解析例句（若有）
        def add_sentence_meanings(entries, label: str):
            if not entries:
                return
            sentence_definitions = []
            for sentence in entries:
                if not isinstance(sentence, dict):
                    continue
                cn = sentence.get('sCn') or sentence.get('cn') or sentence.get('tran') or sentence.get('translation') or sentence.get('target')
                en = sentence.get('sContent') or sentence.get('content') or sentence.get('source') or sentence.get('sentence')
                text = cn or en
                if not text:
                    continue
                sentence_definitions.append({
                    "definition": text,
                    "example": en or ""
                })
            if sentence_definitions:
                meanings.append({
                    "partOfSpeech": label,
                    "definitions": sentence_definitions,
                    "lang": "zh"
                })

        sentence_entries = data.get('sentence') or []
        sentence_entries_alt = data.get('sentences') or []
        example_entries = data.get('examples') or []
        add_sentence_meanings(sentence_entries, "例句")
        add_sentence_meanings(sentence_entries_alt, "例句")
        add_sentence_meanings(example_entries, "例句")

        if not meanings:
            return None

        result = {
            "word": word,
            "phonetic": basic.get('phonetic', '') or basic.get('us-phonetic', '') or basic.get('uk-phonetic', ''),
            "meanings": meanings,
        }

        try:
            print(
                f"📊 有道API统计({word}): explains={len(explains)} "
                f"translation={len(translation)} web={len(web_entries)} "
                f"wfs={len(wfs)} sentence={len(sentence_entries) + len(sentence_entries_alt) + len(example_entries)} meanings={len(meanings)}"
            )
            print(f"📚 有道解析释义({word}): {json.dumps(meanings, ensure_ascii=False)}")
        except Exception as log_error:
            print(f"⚠️ 有道解析日志写入失败: {log_error}")
        elapsed = (time.time() - start_time) * 1000
        print(f"✅ 有道API返回 {len(meanings)} 条释义: {word} ({elapsed:.0f}ms)")

        return result

    except httpx.TimeoutException:
        elapsed = (time.time() - start_time) * 1000
        print(f"有道API超时: {word} ({elapsed:.0f}ms)")
        return None
    except Exception as e:
        elapsed = (time.time() - start_time) * 1000
        print(f"有道API异常: {e} ({elapsed:.0f}ms)")
        return None


def parse_dictionary_entry(entry: dict, original_word: str, lemma: str = None) -> DictionaryResponse:
    """解析词典API返回的数据"""
    return DictionaryResponse(
        word=entry.get("word", original_word),
        phonetic=entry.get("phonetic", ""),
        meanings=entry.get("meanings", []),
        audio=entry.get("audio"),
        searched_word=original_word if lemma and lemma != original_word.lower() else None,
        lemma=lemma if lemma and lemma != original_word.lower() else None
    )


@router.get("/{word}", response_model=DictionaryResponse)
async def lookup_word(word: str):
    """查询单词释义（同时查询中英文，支持词形还原）

    查询策略：
    1. 查询英文释义（Free Dictionary API）
    2. 如果英文查不到，尝试词形还原
    3. 同时查询中文翻译（有道API）
    4. 合并所有结果，前端控制显示哪种语言
    """
    import time
    start_time = time.time()
    query_type = "phrase" if is_phrase_or_sentence(word) else "word"
    print(f"🔍 查询请求: {word} (类型: {query_type})")

    # 0. 先检查缓存
    cache_check_start = time.time()
    cached_result = get_from_cache(word)
    cache_elapsed = (time.time() - cache_check_start) * 1000
    print(f"⏱️ 缓存检查耗时: {cache_elapsed:.0f}ms (命中: {'是' if cached_result else '否'})")
    if cached_result:
        total_elapsed = (time.time() - start_time) * 1000
        print(f"✅ 缓存命中: {word} (总耗时 {total_elapsed:.0f}ms)")
        return DictionaryResponse(**cached_result)

    async with httpx.AsyncClient() as client:
        try:
            lemma = None
            english_entry = None
            chinese_entry = None

            if query_type == "phrase":
                phrase_start = time.time()
                chinese_entry = await query_youdao_translate(client, word)
                phrase_elapsed = (time.time() - phrase_start) * 1000
                print(f"⚡ 查询路线: 短语/句子 → 有道 ({phrase_elapsed:.0f}ms)")
                if not chinese_entry:
                    print("⚠️ 短语翻译为空，尝试英文词典回退")
                    english_entry = await query_free_dictionary(client, word)
            else:
                api_start = time.time()
                english_result, chinese_result = await asyncio.gather(
                    query_free_dictionary(client, word),
                    query_youdao_translate(client, word),
                    return_exceptions=True
                )
                elapsed = (time.time() - api_start) * 1000
                print(f"⚡ 查询路线: 单词 → 并发(英文+中文) ({elapsed:.0f}ms)")

                english_entry = None if isinstance(english_result, Exception) else english_result
                chinese_entry = None if isinstance(chinese_result, Exception) else chinese_result

                if isinstance(english_result, Exception):
                    print(f"❌ 英文释义查询异常: {english_result}")
                if isinstance(chinese_result, Exception):
                    print(f"❌ 中文翻译查询异常: {chinese_result}")

                # 词形还原重试仅针对英文释义
                if not english_entry:
                    lemma_candidate = lemmatize_word(word)
                    if lemma_candidate != word.lower():
                        lemma = lemma_candidate
                        print(f"🔄 词形还原: {word} → {lemma}")
                        retry_start = time.time()
                        retry_result = await query_free_dictionary(client, lemma)
                        retry_elapsed = (time.time() - retry_start) * 1000
                        print(f"↩️  词形还原英文查询耗时: {retry_elapsed:.0f}ms")
                        english_entry = retry_result

            # 4. 合并结果
            if not english_entry and not chinese_entry:
                # 两者都失败
                elapsed = (time.time() - start_time) * 1000
                print(f"❌ 未找到: {word} ({elapsed:.0f}ms)")
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "Word not found",
                        "message": f"未找到 '{word}' 的释义",
                        "word": word,
                        "hint": "英文词典和中文翻译都未找到结果"
                    }
                )

            # 合并英文和中文的 meanings
            combined_meanings = []
            phonetic = ""

            if english_entry:
                combined_meanings.extend(english_entry.get("meanings", []))
                phonetic = english_entry.get("phonetic", "")
                print(f"✅ 英文释义: {len(english_entry.get('meanings', []))} 条")

            if chinese_entry:
                combined_meanings.extend(chinese_entry.get("meanings", []))
                # 如果英文没有音标，使用中文的
                if not phonetic:
                    phonetic = chinese_entry.get("phonetic", "")
                print(f"✅ 中文翻译: {len(chinese_entry.get('meanings', []))} 条")

            # 构造响应
            result = DictionaryResponse(
                word=word,
                phonetic=phonetic,
                meanings=combined_meanings,
                searched_word=word if lemma and lemma != word.lower() else None,
                lemma=lemma if lemma and lemma != word.lower() else None
            )

            # 缓存结果
            save_to_cache(word, result.model_dump())

            elapsed = (time.time() - start_time) * 1000
            print(f"✅ 查询成功: {word} (总耗时 {elapsed:.0f}ms)")
            return result

        except HTTPException:
            total_elapsed = (time.time() - start_time) * 1000
            print(f"❌ 查询失败(HTTP): {word} ({total_elapsed:.0f}ms)")
            raise
        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            print(f"❌ 查询错误: {e} ({elapsed:.0f}ms)")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "Internal server error",
                    "message": f"查询失败: {str(e)}"
                }
            )

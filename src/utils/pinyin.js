/**
 * Simple Pinyin Dictionary for common Chinese characters
 * Browser-compatible alternative to hanzi-to-pinyin
 */

const PINYIN_MAP = {
  '一': 'yi1', '乙': 'yi3',
  '二': 'er4', '十': 'shi2', '人': 'ren2', '入': 'ru4', '八': 'ba1',
  '三': 'san1', '上': 'shang4', '下': 'xia4', '大': 'da4', '小': 'xiao3', '口': 'kou3', '日': 'ri4', '月': 'yue4', '水': 'shui3', '火': 'huo3', '木': 'mu4', '土': 'tu3', '山': 'shan1', '石': 'shi2', '女': 'nv3', '子': 'zi3',
  '中': 'zhong1', '天': 'tian1', '不': 'bu4', '见': 'jian4', '手': 'shou3', '文': 'wen2', '心': 'xin1', '方': 'fang1', '为': 'wei4', '比': 'bi3', '王': 'wang2', '五': 'wu3', '六': 'liu4', '公': 'gong1', '分': 'fen1', '太': 'tai4',
  '本': 'ben3', '正': 'zheng4', '用': 'yong4', '生': 'sheng1', '白': 'bai2', '田': 'tian2', '目': 'mu4', '电': 'dian4', '出': 'chu1', '对': 'dui4', '左': 'zuo3', '右': 'you4', '东': 'dong1', '西': 'xi1', '北': 'bei3', '四': 'si4', '打': 'da3', '民': 'min2', '发': 'fa1', '以': 'yi3',
  '在': 'zai4', '有': 'you3', '自': 'zi4', '年': 'nian2', '回': 'hui2', '同': 'tong2', '好': 'hao3', '多': 'duo1', '全': 'quan2', '会': 'hui4', '老': 'lao3', '她': 'ta1', '向': 'xiang4', '因': 'yin1', '家': 'jia1', '许': 'xu3', '那': 'na4', '百': 'bai3', '安': 'an1', '地': 'di4',
  '你': 'ni3', '我': 'wo3', '他': 'ta1', '来': 'lai2', '说': 'shuo1', '学': 'xue2', '时': 'shi2', '里': 'li3', '走': 'zou3', '坐': 'zuo4', '听': 'ting1', '快': 'kuai4', '花': 'hua1', '男': 'nan2', '们': 'men2', '每': 'mei3', '弟': 'di4', '位': 'wei4', '车': 'che1',
  '国': 'guo2', '和': 'he2', '到': 'dao4', '话': 'hua4', '面': 'mian4', '要': 'yao4', '事': 'shi4', '明': 'ming2', '看': 'kan4', '果': 'guo3', '知': 'zhi1', '长': 'chang2', '雨': 'yu3', '青': 'qing1', '京': 'jing1', '画': 'hua4', '姐': 'jie3', '妈': 'ma1', '河': 'he2',
  '是': 'shi4', '前': 'qian2', '很': 'hen3', '点': 'dian3', '思': 'si1', '音': 'yin1', '香': 'xiang1', '室': 'shi4', '春': 'chun1', '信': 'xin4', '重': 'zhong4', '南': 'nan2',
  '高': 'gao1', '真': 'zhen1', '起': 'qi3', '都': 'dou1', '流': 'liu2', '海': 'hai3', '原': 'yuan2', '能': 'neng2', '样': 'yang4', '笑': 'xiao4', '难': 'nan2',
  '得': 'de2', '着': 'zhe5', '教': 'jiao4', '黄': 'huang2', '唱': 'chang4', '商': 'shang1', '第': 'di4', '接': 'jie1', '做': 'zuo4', '常': 'chang2', '带': 'dai4', '问': 'wen4', '动': 'dong4', '雪': 'xue3', '晚': 'wan3',
  '喜': 'xi3', '道': 'dao4', '最': 'zui4', '就': 'jiu4', '给': 'gei3', '黑': 'hei1', '喝': 'he1',
  '新': 'xin1', '想': 'xiang3', '路': 'lu4', '跳': 'tiao4', '睡': 'shui4', '错': 'cuo4', '歌': 'ge1',
  '算': 'suan4', '管': 'guan3',
  '影': 'ying3', '德': 'de2',
};

/**
 * Convert a Chinese character to pinyin
 * @param {string} character - Single Chinese character
 * @returns {string} - Pinyin with tone number
 */
export function toPinyin(character) {
  if (!character || character.length === 0) return '';
  
  const char = character.charAt(0);
  const pinyin = PINYIN_MAP[char];
  
  if (pinyin) {
    // Remove tone numbers for display if needed
    return pinyin;
  }
  
  // Return empty string if not found
  return '';
}

/**
 * Check if a character is in the pinyin map
 * @param {string} character - Single Chinese character
 * @returns {boolean}
 */
export function hasPinyin(character) {
  if (!character || character.length === 0) return false;
  return !!PINYIN_MAP[character.charAt(0)];
}

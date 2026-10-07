// Parse calendar values without Date/UTC conversion so a chosen day never shifts.
function normalizeNewsPublicationDate(value) {
  if (value === undefined || value === null || value === '') return null;
  const match = typeof value === 'string'
    ? value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2}))?$/)
    : null;
  const invalid = () => {
    const error = new Error('发布日期无效，请选择有效日期（1000—9999 年）');
    error.statusCode = 400;
    throw error;
  };
  if (!match) return invalid();

  const [, yearText, monthText, dayText, hour = '00', minute = '00', second = '00'] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]
    || Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return invalid();

  return `${yearText}-${monthText}-${dayText} ${hour}:${minute}:${second}`;
}

module.exports = { normalizeNewsPublicationDate };

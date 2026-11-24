// WIB has a fixed UTC+7 offset; boundaries are independent of device timezone.
export function getBusinessDay(now = new Date()) {
  const day = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const start = new Date(`${day}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { day, start: start.toISOString(), end: end.toISOString() };
}

const PIX_KEY = "82b37aab-d912-449b-a47c-c0b495884c46";
const MERCHANT_NAME = "FITA";
const MERCHANT_CITY = "PAICANDU";

function field(id: string, value: string) {
  return `${id}${value.length.toString().padStart(2, "0")}${value}`;
}

function crc16Ccitt(value: string) {
  let crc = 0xffff;

  for (const char of value) {
    crc ^= char.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function createPixPayload(amount: number) {
  const merchantAccount = field("00", "br.gov.bcb.pix") + field("01", PIX_KEY);
  const additionalData = field("05", "***");
  const payload = [
    field("00", "01"),
    field("26", merchantAccount),
    field("52", "0000"),
    field("53", "986"),
    field("54", amount.toFixed(2)),
    field("58", "BR"),
    field("59", MERCHANT_NAME),
    field("60", MERCHANT_CITY),
    field("62", additionalData),
  ].join("");

  return `${payload}6304${crc16Ccitt(`${payload}6304`)}`;
}

export { PIX_KEY };

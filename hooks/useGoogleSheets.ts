import { useEffect, useState } from "react";

const SHEET_ID = "1bLel0b3ULXWJ71Tgn_ynl5fvBrDIMZXo-CzeV9lnE3k";
const SHEET_NAME = "moliya";
const API_KEY = "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";

export interface MoliyaRow {
  sana: string;
  ism: string;
  filial: string;
  turi: string;
  summa: number;
  kategoriya: string;
  izoh: string;
}

export function useMoliyaData() {
  const [rows, setRows] = useState<MoliyaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Sheets API error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const [, ...dataRows] = data.values as string[][];
        const parsed: MoliyaRow[] = dataRows
          .filter((r) => r.length >= 5)
          .map((r) => ({
            sana: r[0] ?? "",
            ism: r[1] ?? "",
            filial: r[2] ?? "",
            turi: r[3] ?? "",
            summa: parseSumma(r[4] ?? "0"),
            kategoriya: r[5] ?? "",
            izoh: r[6] ?? "",
          }));
        setRows(parsed);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return { rows, loading, error };
}

function parseSumma(raw: string): number {
  const cleaned = raw
    .replace(/p\./gi, "")
    .replace(/\s/g, "")
    .replace(",", ".");
  return parseFloat(cleaned) || 0;
}

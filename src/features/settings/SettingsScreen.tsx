import type { FormEvent } from "react";
import { useState } from "react";
import type { Asset, Liability, Settings, Snapshot } from "../../domain/types";
import { signOutUser } from "../../firebase/auth";
import { generateWealthMarkdown } from "../../utils/aiExporter";
import { createBackup, parseBackup } from "../../utils/backup";

type SettingsScreenProps = {
  assets: Asset[];
  liabilities: Liability[];
  snapshots: Snapshot[];
  settings: Settings;
  onSaveSettings: (settings: Settings) => Promise<void>;
  onSaveAsset: (asset: Asset) => Promise<void>;
  onSaveLiability: (liability: Liability) => Promise<void>;
  onSaveSnapshot: (snapshot: Snapshot) => Promise<void>;
};

export function SettingsScreen({
  assets,
  liabilities,
  snapshots,
  settings,
  onSaveSettings,
  onSaveAsset,
  onSaveLiability,
  onSaveSnapshot
}: SettingsScreenProps) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function handleCopyToClipboard() {
    try {
      const md = generateWealthMarkdown(settings, assets, liabilities, snapshots);
      await navigator.clipboard.writeText(md);
      setCopyMessage("คัดลอกข้อมูลลง Clipboard สำเร็จ! นำไปวางในแชต AI เพื่อวิเคราะห์ได้เลย");
      setTimeout(() => setCopyMessage(null), 4000);
    } catch {
      setCopyMessage("คัดลอกไม่สำเร็จ กรุณาลองอีกครั้ง");
      setTimeout(() => setCopyMessage(null), 4000);
    }
  }

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSaveSettings({ mainCurrency: String(form.get("mainCurrency") ?? "THB").toUpperCase() });
  }

  function exportBackup() {
    const payload = createBackup(settings, assets, liabilities, snapshots);
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `wealth-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importBackup(file: File | undefined) {
    if (!file) {
      return;
    }

    const backup = parseBackup(await file.text());
    await Promise.all([
      onSaveSettings(backup.settings),
      ...backup.assets.map((asset) => onSaveAsset(asset)),
      ...backup.liabilities.map((liability) => onSaveLiability(liability)),
      ...backup.snapshots.map((snapshot) => onSaveSnapshot(snapshot))
    ]);
  }

  return (
    <section className="screen-stack">
      <div className="screen-title">
        <p className="screen-kicker">ตั้งค่า</p>
        <h1>แอปและสำรองข้อมูล</h1>
        <p>ใช้ค่า Firebase env vars ชุดเดียวกันใน Vercel สำหรับ production</p>
      </div>

      <article className="panel">
        <form className="form-grid" onSubmit={handleSettingsSubmit}>
          <label>
            สกุลเงินหลัก
            <input name="mainCurrency" defaultValue={settings.mainCurrency} maxLength={3} required />
          </label>
          <button className="primary-button" type="submit">
            บันทึกสกุลเงิน
          </button>
        </form>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>สำรองข้อมูล</h2>
          <span>JSON</span>
        </div>
        <p className="empty-text">ไฟล์ export รวมสินทรัพย์ หนี้สิน สแนปช็อต และการตั้งค่าที่คุณกรอกเอง</p>
        <button className="secondary-button" type="button" onClick={exportBackup}>
          ส่งออก JSON
        </button>
        <label>
          นำเข้า JSON
          <input
            accept="application/json"
            type="file"
            onChange={(event) => {
              importBackup(event.currentTarget.files?.[0]).catch(() => {
                alert("นำเข้าไม่สำเร็จ กรุณาตรวจสอบว่าไฟล์เป็น backup ของ Wealth Tracker ที่ถูกต้อง");
              });
              event.currentTarget.value = "";
            }}
          />
        </label>
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>วิเคราะห์พอร์ตด้วย AI</h2>
          <span>Markdown</span>
        </div>
        <p className="empty-text">คัดลอกสรุปรายการสินทรัพย์ หนี้สิน และประวัติ snapshot ในรูปแบบ Markdown เพื่อนำไปใช้วางให้ AI (เช่น Gemini, ChatGPT, Claude) วิเคราะห์ได้ทันที</p>
        <button className="primary-button" type="button" onClick={handleCopyToClipboard}>
          คัดลอกข้อมูลสำหรับ AI
        </button>
        {copyMessage ? <p className="success-text" style={{ fontSize: "0.82rem", marginTop: "4px" }}>{copyMessage}</p> : null}
      </article>

      <article className="panel">
        <div className="section-heading">
          <h2>เซสชัน</h2>
        </div>
        <button className="secondary-button" type="button" onClick={signOutUser}>
          ออกจากระบบ
        </button>
      </article>
    </section>
  );
}

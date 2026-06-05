import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Unsubscribe
} from "firebase/firestore";
import type { Asset, Liability, Settings, Snapshot } from "../domain/types";
import { db } from "../firebase/firestore";

export function getUserPath(uid: string) {
  return `users/${uid}`;
}

export function getSettingsPath(uid: string) {
  return `${getUserPath(uid)}/settings/main`;
}

export function getAssetPath(uid: string, assetId: string) {
  return `${getUserPath(uid)}/assets/${assetId}`;
}

export function getLiabilityPath(uid: string, liabilityId: string) {
  return `${getUserPath(uid)}/liabilities/${liabilityId}`;
}

export function getSnapshotPath(uid: string, snapshotId: string) {
  return `${getUserPath(uid)}/snapshots/${snapshotId}`;
}

export async function loadSettings(uid: string): Promise<Settings> {
  const snapshot = await getDoc(doc(db, getSettingsPath(uid)));
  return snapshot.exists() ? (snapshot.data() as Settings) : { mainCurrency: "THB" };
}

export async function saveSettings(uid: string, settings: Settings) {
  await setDoc(doc(db, getSettingsPath(uid)), removeUndefinedFields(settings), { merge: true });
}

export function subscribeAssets(uid: string, callback: (assets: Asset[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid), "assets"), (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as Asset));
  });
}

export async function saveAsset(uid: string, asset: Asset) {
  await setDoc(doc(db, getAssetPath(uid, asset.id)), removeUndefinedFields(asset), { merge: true });
}

export async function deleteAsset(uid: string, assetId: string) {
  await deleteDoc(doc(db, getAssetPath(uid, assetId)));
}

export function subscribeLiabilities(uid: string, callback: (liabilities: Liability[]) => void): Unsubscribe {
  return onSnapshot(collection(db, getUserPath(uid), "liabilities"), (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as Liability));
  });
}

export async function saveLiability(uid: string, liability: Liability) {
  await setDoc(doc(db, getLiabilityPath(uid, liability.id)), removeUndefinedFields(liability), { merge: true });
}

export async function deleteLiability(uid: string, liabilityId: string) {
  await deleteDoc(doc(db, getLiabilityPath(uid, liabilityId)));
}

export function subscribeSnapshots(uid: string, callback: (snapshots: Snapshot[]) => void): Unsubscribe {
  const snapshotsQuery = query(collection(db, getUserPath(uid), "snapshots"), orderBy("date", "asc"));
  return onSnapshot(snapshotsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => item.data() as Snapshot));
  });
}

export async function saveSnapshot(uid: string, snapshot: Snapshot) {
  await setDoc(doc(db, getSnapshotPath(uid, snapshot.id)), removeUndefinedFields(snapshot), { merge: true });
}

export async function deleteSnapshot(uid: string, snapshotId: string) {
  await deleteDoc(doc(db, getSnapshotPath(uid, snapshotId)));
}

export function removeUndefinedFields<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => removeUndefinedFields(item)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [key, removeUndefinedFields(entryValue)]),
  ) as T;
}

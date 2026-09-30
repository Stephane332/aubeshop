/**
 * lib/uploadService.ts
 * ====================
 * Envoi d'images vers Firebase Storage.
 *
 * Comble un manque total de la v1 : `expo-image-picker` était installé, mais
 * **aucun octet n'était jamais envoyé**. Les photos de produits et les cartes
 * d'étudiant étaient enregistrées sous forme d'URI locale du téléphone —
 * l'administrateur recevait donc un chemin de fichier illisible, pointant
 * vers l'appareil de quelqu'un d'autre.
 */

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from './firebase.config';

/** Au-delà, on refuse : inutile de faire monter 12 Mo sur un réseau mobile. */
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Transforme une URI locale (`file://`, `content://`, `blob:`) en `Blob`.
 *
 * `fetch` sur une URI locale fonctionne aussi bien sous React Native que sur
 * le web, ce qui évite deux implémentations.
 */
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) throw new Error("Impossible de lire l'image sélectionnée");
  return response.blob();
}

/** Extension déduite du type MIME, pour que Storage serve le bon en-tête. */
function extensionFor(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('heic') || mime.includes('heif')) return 'heic';
  return 'jpg';
}

/**
 * Envoie une image et renvoie son URL publique de téléchargement.
 *
 * @param uri    URI locale issue du sélecteur d'images.
 * @param folder Dossier de destination (`products/{uid}`, `applications/{uid}`…).
 */
export async function uploadImage(uri: string, folder: string): Promise<string> {
  const blob = await uriToBlob(uri);

  if (blob.size > MAX_BYTES) {
    throw new Error('Image trop lourde (5 Mo maximum). Réduisez-la et réessayez.');
  }

  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${extensionFor(blob.type)}`;
  const objectRef = ref(storage, `${folder}/${name}`);

  await uploadBytes(objectRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(objectRef);
}

/**
 * Envoie plusieurs images en parallèle, en conservant l'ordre d'origine
 * (la première sert de vignette au produit).
 *
 * Les URI qui sont déjà des URL `https` sont laissées telles quelles : à la
 * modification d'un produit, on ne renvoie pas les photos inchangées.
 */
export async function uploadImages(uris: string[], folder: string): Promise<string[]> {
  return Promise.all(
    uris.map((uri) => (uri.startsWith('http') ? Promise.resolve(uri) : uploadImage(uri, folder)))
  );
}

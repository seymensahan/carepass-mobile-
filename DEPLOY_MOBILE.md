# Guide de déploiement mobile — CARYPASS

Ce guide explique comment builder et soumettre l'app CARYPASS sur **App Store (iOS)** et **Google Play Store (Android)** avec EAS (Expo Application Services).

---

## Prérequis

- Node.js 18+ installé
- Compte Expo (`npx eas-cli login`)
- Pour iOS : Apple Developer Program (payé par l'Account Holder, **99$/an**)
- Pour Android : Google Play Developer account (**25$ une fois**)
- Avoir la clé API App Store Connect (`.p8`) dans `private_keys/`

---

## 1. Préparation avant chaque release

### 1.1 Mettre à jour la version

Éditez `app.json` :

```json
{
  "expo": {
    "version": "1.0.1",   // incrémentez à chaque release
    "ios": {
      "buildNumber": "3"  // incrémentez à chaque build iOS (auto-incrémenté si eas.json a autoIncrement)
    },
    "android": {
      "versionCode": 3    // incrémentez à chaque build Android
    }
  }
}
```

> **Note** : avec `autoIncrement: true` dans `eas.json` (profil production), EAS gère ça automatiquement côté remote.

### 1.2 Vérifier que l'app compile

```bash
cd mobile
npx tsc --noEmit     # Vérifie qu'il n'y a aucune erreur TypeScript
```

### 1.3 Commiter le code

Toujours committer avant de builder — EAS enregistre le hash Git avec chaque build.

```bash
git add .
git commit -m "release: v1.0.1"
git push
```

---

## 2. Build iOS (App Store)

### 2.1 Première configuration (une seule fois)

**Bundle Identifier** dans `app.json` :
```json
"ios": {
  "bundleIdentifier": "com.carypass.carypass",
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

**Configuration EAS** pour la submission dans `eas.json` :
```json
"submit": {
  "production": {
    "ios": {
      "ascApiKeyPath": "./private_keys/AuthKey_XXXXXX.p8",
      "ascApiKeyId": "XXXXXX",
      "ascApiKeyIssuerId": "xxxx-xxxx-xxxx-xxxx"
    }
  }
}
```

### 2.2 Obtenir la clé App Store Connect API (si pas encore fait)

L'Account Holder (ex: Ouatedem Yvan) doit :
1. Aller sur https://appstoreconnect.apple.com/access/integrations/api
2. Cliquer **Generate API Key**
3. Name : `EAS CARYPASS`, Access : **Admin**
4. Télécharger le fichier `.p8` (**attention : une seule fois possible !**)
5. Noter **Key ID** et **Issuer ID**
6. Partager les 3 infos via canal sécurisé (1Password, Signal, etc.)

Côté développeur qui déploie :
- Placer le fichier dans `mobile/private_keys/AuthKey_XXXXXX.p8`
- Mettre à jour `eas.json` avec Key ID et Issuer ID
- S'assurer que `private_keys/` est dans `.gitignore` (**ne jamais commiter !**)

### 2.3 Lancer le build

```bash
cd mobile
npx eas-cli build --platform ios --profile production
```

Si c'est la **première fois** sur votre machine, EAS va demander :
- Apple ID & mot de passe + 2FA → saisir les credentials de l'Account Holder
- Il créera automatiquement Distribution Certificate + Provisioning Profile

Durée : **10-45 min** selon la file d'attente Expo.

**Suivre le build en temps réel** :
https://expo.dev/accounts/adrienclaude/projects/carepass/builds

### 2.4 Soumettre à App Store Connect

Une fois le build terminé (statut "Finished") :

```bash
npx eas-cli submit --platform ios --latest
```

Grâce à l'API Key dans `eas.json`, **aucun mot de passe ni 2FA n'est demandé**.

Durée : **2-5 min** pour l'upload + **10-30 min** pour le traitement Apple.

### 2.5 Compléter le formulaire sur App Store Connect

Allez sur https://appstoreconnect.apple.com → CARYPASS → iOS App 1.0

**Champs obligatoires** :
- **Screenshots** : au moins 3, format 1242×2688 (iPhone 6.5") ou 1284×2778 (iPhone 6.7")
- **Description** : max 4000 caractères
- **Keywords** : max 100 caractères, séparés par virgule
- **Support URL** : https://carypass.cm/contact
- **Age Rating** : remplir le questionnaire
- **Category** : **Medical**
- **Build** : cliquer **+ Add Build** → sélectionner le build uploadé
- **Export Compliance** : répondre **No** (déjà géré par `ITSAppUsesNonExemptEncryption: false`)
- **App Privacy** : déclarer les données collectées (email, nom, téléphone, santé)
- **App Review Information** :
  - Contact Info (nom, email, téléphone)
  - Démo account credentials (créer un compte test avec données réalistes)
  - Notes pour le reviewer (ex: "Connectez-vous avec le compte test, créez une consultation, scannez le QR d'urgence")

**Soumettre** : en haut à droite **Add for Review** → **Submit to App Review**

Délai de review Apple : **24-72h** en moyenne. Suivre le statut sur App Store Connect.

---

## 3. Build Android (Google Play Store)

### 3.1 Configuration (une seule fois)

Dans `app.json` :
```json
"android": {
  "package": "com.carypass.app",
  "versionCode": 1
}
```

### 3.2 Créer la clé de signature Android (si pas encore fait)

EAS gère automatiquement la clé upload Android si vous choisissez "Let EAS handle this for me" au premier build.

Pour la submission, vous aurez besoin d'un **service account JSON** Google Play :
1. Aller sur https://play.google.com/console → Setup → API Access
2. Create New Service Account
3. Rôle : **Release Manager**
4. Télécharger le fichier JSON
5. Placer dans `private_keys/google-play-service-account.json`

Mettre à jour `eas.json` :
```json
"submit": {
  "production": {
    "android": {
      "serviceAccountKeyPath": "./private_keys/google-play-service-account.json",
      "track": "internal"
    }
  }
}
```

### 3.3 Build + Submit

```bash
npx eas-cli build --platform android --profile production
npx eas-cli submit --platform android --latest
```

### 3.4 Compléter Google Play Console

- Screenshots (phone 1080×1920 min)
- Graphique de fonctionnalités 1024×500
- Description courte (80 car) + longue (4000 car)
- Catégorie : Medical
- Contenu Rating (questionnaire IARC)
- Privacy Policy URL (obligatoire)
- Soumettre à internal/closed/production track

---

## 4. Mises à jour (OTA - Over The Air)

Pour les **petits changements** (bug fix, texte, logique JS), pas besoin de rebuild natif. Utilisez les updates OTA Expo :

```bash
npx eas-cli update --branch production --message "Fix login bug"
```

Les utilisateurs reçoivent le correctif au prochain démarrage de l'app, **sans passer par l'App Store**.

**Limites** : les changements de packages natifs, permissions, icônes, version native nécessitent un nouveau build.

---

## 5. Troubleshooting

### "Apple provided the following error info: You are not registered as an Apple Developer"

Votre Apple ID n'est pas membre du Developer Program. Deux solutions :
1. L'Account Holder vous ajoute sur https://developer.apple.com/account/resources/people
2. Utiliser temporairement l'Apple ID de l'Account Holder

### "Slug for project does not match"

Le `slug` dans `app.json` doit correspondre au projet EAS. Vérifier sur https://expo.dev/accounts/adrienclaude/projects

### Build échoue pendant "Install pods"

Souvent un problème de version iOS / Xcode côté EAS. Regardez les logs pour voir quel package pose problème. Mettre à jour les dépendances avec :
```bash
npx expo install --fix
```

### Submit bloque sur "Two-Factor Authentication"

C'est que vous n'avez pas configuré l'API Key dans `eas.json`. Ajoutez-la (voir section 2.1) pour éviter le 2FA à chaque submit.

### Erreur "ITSAppUsesNonExemptEncryption"

Ajouter dans `app.json` :
```json
"ios": {
  "infoPlist": {
    "ITSAppUsesNonExemptEncryption": false
  }
}
```

---

## 6. Checklist de release

Avant chaque release production :

- [ ] Toutes les features testées en local et sur TestFlight
- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] Version bumped dans `app.json`
- [ ] Code committé et pushé sur `main`
- [ ] Build EAS iOS + Android lancés
- [ ] Builds testés via TestFlight (iOS) et Internal Testing (Android)
- [ ] Screenshots mis à jour si UI a changé
- [ ] Release notes rédigées
- [ ] Soumission pour review Apple + Google Play
- [ ] Email d'approbation reçu → app en ligne

---

## 7. URLs utiles

- **Dashboard EAS** : https://expo.dev/accounts/adrienclaude/projects/carepass
- **App Store Connect** : https://appstoreconnect.apple.com
- **Google Play Console** : https://play.google.com/console
- **Apple Developer** : https://developer.apple.com/account
- **Docs EAS Build** : https://docs.expo.dev/build/introduction/
- **Docs EAS Submit** : https://docs.expo.dev/submit/introduction/

---

_Dernière mise à jour : 20 avril 2026 — première soumission iOS de CARYPASS_

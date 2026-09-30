(() => {
  "use strict";

  const FOLLOWERS_STORAGE_KEY = "aslFollowers";
  let currentFollower = null;

  const followerUiText = {
    fr: {
      nav: "🌐 Follower",
      title: "🌐 Espace Follower",
      text: "Accès séparé avec un identifiant F et un code personnel, sans mélange avec les élèves.",
      button: "Entrer comme Follower"
    },
    es: {
      nav: "🌐 Follower",
      title: "🌐 Espacio Follower",
      text: "Acceso separado con un identificador F y un código personal, sin mezclarlo con los alumnos.",
      button: "Entrar como Follower"
    },
    en: {
      nav: "🌐 Follower",
      title: "🌐 Follower space",
      text: "Separate access with an F identifier and a personal code, kept apart from student records.",
      button: "Enter as Follower"
    }
  };

  function getFollowers() {
    try {
      return JSON.parse(localStorage.getItem(FOLLOWERS_STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveFollowers(followers) {
    localStorage.setItem(FOLLOWERS_STORAGE_KEY, JSON.stringify(followers));
  }

  function nextFollowerIdentifier() {
    const nums = getFollowers()
      .map(f => Number(String(f.followerId || "").replace(/^F/i, "")))
      .filter(n => Number.isInteger(n) && n > 0);
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return "F" + next;
  }

  function refreshNextFollowerId() {
    const input = document.getElementById("newFollowerId");
    if (input) input.value = nextFollowerIdentifier();
  }

  window.generateFollowerCode = function() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let a = "";
    let b = "";
    for (let i = 0; i < 4; i++) a += chars[Math.floor(Math.random() * chars.length)];
    for (let i = 0; i < 4; i++) b += Math.floor(Math.random() * 10);
    const input = document.getElementById("newFollowerCode");
    if (input) {
      input.value = a + "-" + b;
      input.type = "text";
    }
  };

  window.addFollower = function() {
    const idInput = document.getElementById("newFollowerId");
    const codeInput = document.getElementById("newFollowerCode");
    if (!idInput || !codeInput) return;

    const followerId = idInput.value.trim().toUpperCase();
    const code = codeInput.value.trim();

    if (!/^F\d+$/.test(followerId)) {
      alert("Identifiant Follower invalide.");
      return;
    }
    if (!code) {
      alert("Merci de générer ou d'indiquer un code personnel.");
      return;
    }

    const followers = getFollowers();
    if (followers.some(f => f.followerId === followerId)) {
      alert("Cet identifiant Follower existe déjà.");
      return;
    }
    if (followers.some(f => f.code === code)) {
      alert("Ce code personnel existe déjà.");
      return;
    }

    followers.push({
      id: Date.now(),
      followerId,
      code,
      createdAt: new Date().toLocaleString("fr-FR"),
      pdfFileName: "QUESTIONNAIRE_FOLLOWER_" + followerId + ".pdf"
    });

    saveFollowers(followers);
    codeInput.value = "";
    codeInput.type = "password";
    loadFollowersTable();
    refreshNextFollowerId();
    alert("Accès " + followerId + " créé sans modifier les élèves.");
  };

  window.deleteFollower = function(id) {
    if (!confirm("Supprimer cet accès Follower ?")) return;
    const followers = getFollowers().filter(f => f.id !== id);
    saveFollowers(followers);
    loadFollowersTable();
    refreshNextFollowerId();
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.loadFollowersTable = function() {
    const tbody = document.getElementById("followersTable");
    if (!tbody) return;
    const followers = getFollowers();

    if (!followers.length) {
      tbody.innerHTML = '<tr><td colspan="5">Aucun Follower enregistré.</td></tr>';
      return;
    }

    tbody.innerHTML = followers.map(f => \`
      <tr>
        <td><strong>\${escapeHtml(f.followerId)}</strong></td>
        <td><strong>\${escapeHtml(f.code)}</strong></td>
        <td><button class="btn-follower" onclick="downloadFollowerPdf('\${escapeHtml(f.followerId)}')">Créer le PDF</button></td>
        <td>\${escapeHtml(f.createdAt || "-")}</td>
        <td><button class="btn-danger" onclick="deleteFollower(\${Number(f.id)})">Supprimer</button></td>
      </tr>
    \`).join("");
  };

  window.openFollowerLogin = function() {
    currentLoginMode = "follower";
    const lang = currentLang || "fr";
    const titleMap = {
      fr: "Connexion Follower",
      es: "Conexión Follower",
      en: "Follower login"
    };
    const textMap = {
      fr: "Entre ton identifiant F (exemple F1) et ton code personnel.",
      es: "Introduce tu identificador F (por ejemplo F1) y tu código personal.",
      en: "Enter your F identifier (for example F1) and your personal code."
    };

    loginTitle.innerText = titleMap[lang] || titleMap.fr;
    loginText.innerText = textMap[lang] || textMap.fr;
    loginNameLabel.innerText = "Identifiant Follower";
    loginNameLabel.style.display = "block";
    loginName.style.display = "block";
    loginName.placeholder = "Exemple : F1";
    loginCode.type = "password";
    loginCode.value = "";
    loginName.value = "";
    loginModal.classList.remove("hidden");
  };

  const baseOpenStudentLogin = window.openStudentLogin;
  window.openStudentLogin = function() {
    loginNameLabel.innerText = "Nom ou identifiant";
    loginName.placeholder = "Nom ou identifiant";
    return baseOpenStudentLogin();
  };

  const baseValidateLogin = window.validateLogin;
  window.validateLogin = function() {
    if (currentLoginMode === "follower") {
      const followerId = loginName.value.trim().toUpperCase();
      const code = loginCode.value.trim();
      const found = getFollowers().find(f =>
        String(f.followerId).toUpperCase() === followerId && f.code === code
      );

      if (!found) {
        alert("Identifiant ou code Follower incorrect.");
        return;
      }

      currentFollower = found;
      closeLogin();
      teacherDashboard.classList.add("hidden");
      studentDashboard.classList.add("hidden");
      document.getElementById("followerDashboard").classList.remove("hidden");
      updateFollowerDashboard();
      document.getElementById("followerDashboard").scrollIntoView({ behavior: "smooth" });
      return;
    }

    document.getElementById("followerDashboard").classList.add("hidden");
    baseValidateLogin();

    if (currentLoginMode === "teacher" && !teacherDashboard.classList.contains("hidden")) {
      loadFollowersTable();
      refreshNextFollowerId();
    }
  };

  function updateFollowerDashboard() {
    if (!currentFollower) return;
    const box = document.getElementById("followerWelcome");
    box.innerHTML =
      'Identifiant : <strong>' + escapeHtml(currentFollower.followerId) + '</strong><br>' +
      'Questionnaire personnel : <strong>' + escapeHtml(currentFollower.pdfFileName) + '</strong>';
  }

  window.downloadCurrentFollowerPdf = function() {
    if (!currentFollower) {
      alert("Aucun Follower connecté.");
      return;
    }
    return downloadFollowerPdf(currentFollower.followerId);
  };

  function drawHeader(page, code, font, bold) {
    const { rgb } = PDFLib;
    page.drawText(code, { x: 46, y: 795, size: 24, font: bold, color: rgb(0.06,0.09,0.16) });
    page.drawText("Questionnaire de suivi numérique", { x: 46, y: 755, size: 15, font: bold, color: rgb(0.06,0.09,0.16) });
    page.drawText("Document de suivi pédagogique - aucun nom n'est demandé.", { x: 46, y: 735, size: 9, font, color: rgb(0.28,0.34,0.42) });
  }

  function drawSection(page, title, y, bold) {
    const { rgb } = PDFLib;
    page.drawRectangle({ x: 46, y: y - 4, width: 503, height: 24, color: rgb(0.94,0.97,1) });
    page.drawText(title, { x: 56, y: y + 3, size: 11, font: bold, color: rgb(0.15,0.39,0.92) });
  }

  function addText(form, page, name, x, y, width, height, font) {
    const { rgb } = PDFLib;
    const field = form.createTextField(name);
    field.enableMultiline();
    field.addToPage(page, {
      x, y, width, height, font,
      borderWidth: 1,
      borderColor: rgb(0.80,0.84,0.89),
      backgroundColor: rgb(1,1,1),
      textColor: rgb(0.06,0.09,0.16)
    });
  }

  function addCheck(form, page, name, label, x, y, font) {
    const { rgb } = PDFLib;
    const cb = form.createCheckBox(name);
    cb.addToPage(page, {
      x, y, width: 12, height: 12,
      borderWidth: 1,
      borderColor: rgb(0.80,0.84,0.89),
      backgroundColor: rgb(1,1,1)
    });
    page.drawText(label, { x: x + 18, y: y + 1, size: 9, font, color: rgb(0.06,0.09,0.16) });
  }

  window.downloadFollowerPdf = async function(code) {
    if (!window.PDFLib) {
      alert("Le générateur PDF n'a pas pu être chargé. Vérifie la connexion internet puis réessaie.");
      return;
    }

    const safeCode = String(code || "").toUpperCase().trim();
    if (!/^F\d+$/.test(safeCode)) {
      alert("Identifiant Follower invalide.");
      return;
    }

    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const form = pdfDoc.getForm();
    const size = [595.28, 841.89];

    // PAGE 1
    let page = pdfDoc.addPage(size);
    drawHeader(page, safeCode, font, bold);

    drawSection(page, "1. Mon niveau actuel en numérique", 690, bold);
    ["Je débute presque complètement","Débutant","Intermédiaire","Autonome","Avancé"]
      .forEach((label, i) => addCheck(form, page, safeCode + "_niveau_" + (i+1), label, 58, 646 - i*22, font));

    page.drawText("Appareils que j'utilise actuellement :", { x:46, y:520, size:9.5, font:bold, color:rgb(0.06,0.09,0.16) });
    ["Ordinateur","Smartphone","Tablette"].forEach((label,i)=>addCheck(form,page,safeCode+"_appareil_"+(i+1),label,58,486-i*22,font));
    ["Imprimante / scanner","Aucun régulièrement"].forEach((label,i)=>addCheck(form,page,safeCode+"_appareil_"+(i+4),label,320,486-i*22,font));

    drawSection(page, "2. Ce que je veux apprendre", 390, bold);
    const topics = [
      "Utiliser un ordinateur","Internet et recherche","E-mail / Gmail","Smartphone",
      "Démarches administratives","Sécurité numérique","Visioconférence",
      "Word / traitement de texte","Excel / tableur","Intelligence artificielle",
      "Créer une page web","Autre"
    ];
    topics.forEach((label,i)=>{
      const left = i < 6;
      const row = left ? i : i-6;
      addCheck(form,page,safeCode+"_apprendre_"+(i+1),label,left?58:320,346-row*22,font);
    });
    page.drawText("Autre apprentissage souhaité :", { x:46, y:200, size:9.5, font:bold, color:rgb(0.06,0.09,0.16) });
    addText(form,page,safeCode+"_apprendre_autre",46,150,503,38,font);

    // PAGE 2
    page = pdfDoc.addPage(size);
    page.drawText(safeCode, { x:46, y:795, size:20, font:bold, color:rgb(0.06,0.09,0.16) });
    const p2 = [
      ["3. Mes besoins et difficultés","Qu'est-ce qui est le plus difficile pour moi aujourd'hui avec le numérique ?",640,safeCode+"_besoins"],
      ["4. Mes projets personnels","Quel projet concret aimerais-je réussir grâce au numérique ?",470,safeCode+"_projets"],
      ["5. Mes envies","Qu'aimerais-je pouvoir faire plus facilement ou plus souvent ?",300,safeCode+"_envies"],
      ["6. Mes ambitions","Où aimerais-je en être dans 3 à 6 mois ?",130,safeCode+"_ambitions"]
    ];
    p2.forEach(([title,prompt,y,name])=>{
      drawSection(page,title,y+70,bold);
      page.drawText(prompt,{x:46,y:y+45,size:9,font,color:rgb(0.06,0.09,0.16)});
      addText(form,page,name,46,y-30,503,62,font);
    });

    // PAGE 3
    page = pdfDoc.addPage(size);
    page.drawText(safeCode, { x:46, y:795, size:20, font:bold, color:rgb(0.06,0.09,0.16) });
    const p3 = [
      ["7. Mes idées","Une idée, un service, une activité, un projet ou une création que j'aimerais développer :",640,safeCode+"_idees"],
      ["8. Mes blocages","Ce qui me freine : peur de me tromper, manque de matériel, mots de passe, sécurité, autre :",470,safeCode+"_blocages"],
      ["9. Questions ouvertes","Quelles questions aimerais-je poser au formateur ?",300,safeCode+"_questions"],
      ["10. Ce qui m'aiderait le plus","Décris le type d'aide ou d'accompagnement qui te conviendrait le mieux :",130,safeCode+"_aide"]
    ];
    p3.forEach(([title,prompt,y,name])=>{
      drawSection(page,title,y+70,bold);
      page.drawText(prompt,{x:46,y:y+45,size:9,font,color:rgb(0.06,0.09,0.16)});
      addText(form,page,name,46,y-30,503,62,font);
    });

    // PAGE 4
    page = pdfDoc.addPage(size);
    page.drawText(safeCode, { x:46, y:795, size:20, font:bold, color:rgb(0.06,0.09,0.16) });
    drawSection(page, "11. Ma façon préférée d'apprendre", 720, bold);
    const prefs = [
      "Explications très simples et lentes","Démonstration puis pratique","Exercices courts","Vidéo",
      "Images / captures d'écran","Fiche PDF imprimable","Accompagnement individuel","Petit groupe"
    ];
    prefs.forEach((label,i)=>{
      const left = i < 4;
      const row = left ? i : i-4;
      addCheck(form,page,safeCode+"_preference_"+(i+1),label,left?58:320,670-row*24,font);
    });

    drawSection(page, "12. Mes disponibilités et mon rythme", 555, bold);
    page.drawText("Jours / moments les plus faciles pour moi :", {x:46,y:525,size:9,font,color:rgb(0.06,0.09,0.16)});
    addText(form,page,safeCode+"_disponibilites",46,465,503,48,font);
    ["Ponctuel","1 fois par semaine","2 fois par semaine","Selon mes besoins"]
      .forEach((label,i)=>addCheck(form,page,safeCode+"_rythme_"+(i+1),label,i%2===0?58:320,430-Math.floor(i/2)*24,font));

    drawSection(page, "13. Mon objectif prioritaire", 350, bold);
    page.drawText("Si je ne devais choisir qu'un seul objectif pour commencer, ce serait :", {x:46,y:320,size:9,font,color:rgb(0.06,0.09,0.16)});
    addText(form,page,safeCode+"_objectif_prioritaire",46,245,503,58,font);

    drawSection(page, "14. Notes complémentaires", 190, bold);
    addText(form,page,safeCode+"_notes",46,70,503,92,font);

    form.updateFieldAppearances(font);
    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "QUESTIONNAIRE_FOLLOWER_" + safeCode + ".pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const baseSetLanguage = window.setLanguage;
  window.setLanguage = function(lang) {
    baseSetLanguage(lang);
    const t = followerUiText[lang] || followerUiText.fr;
    const nav = document.getElementById("navFollowerBtn");
    const title = document.getElementById("followerCardTitle");
    const text = document.getElementById("followerCardText");
    const btn = document.getElementById("followerBtn");
    if (nav) nav.innerText = t.nav;
    if (title) title.innerText = t.title;
    if (text) text.innerText = t.text;
    if (btn) btn.innerText = t.button;
  };

  refreshNextFollowerId();
  loadFollowersTable();
})();
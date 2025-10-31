document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos HTML ---
    const steps = document.querySelectorAll('.step');
    const plateInput = document.getElementById('plate');
    const startButton = document.getElementById('start-btn'); // ✅ CORRIGIDO: Esta linha estava faltando
    const truckTypeForm = document.getElementById('truck-type-form');
    const startTireCheckBtn = document.getElementById('start-tire-check-btn');
    const tireForms = document.querySelectorAll('.tire-form');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const pdfButton = document.getElementById('pdf-btn');
    const whatsappButton = document.getElementById('whatsapp-btn');
    const restartButton = document.getElementById('restart-btn');
    const summaryPlate = document.getElementById('summary-plate');
    const summaryTruckType = document.getElementById('summary-truck-type');
    const summaryDateTime = document.getElementById('summary-datetime');
    const summaryItems = document.getElementById('summary-items');
    const summaryTires = document.getElementById('summary-tires');
    const summaryObs = document.getElementById('summary-obs');
    const obsForm = document.getElementById('obs-form');
    const autoDefectsList = document.getElementById('auto-defects-list');
    const tireAnalysisList = document.getElementById('tire-analysis-list');

    // --- Variáveis de Estado ---
    let currentStepId = 'step-0';
    const checklistData = {
        plate: '',
        truckType: '',
        dateTime: '',
        items: {},
        tires: {},
        observacoes: ''
    };
    
    // ✅ CORRIGIDO: A variável que faltava foi readicionada aqui
    const totalChecklistSteps = 7; 

    // Mapeamento para nomes amigáveis (com itens detalhados)
    const itemLabels = {
        lanterna_esq: "Lanterna Diant. Esq.",
        lanterna_dir: "Lanterna Diant. Dir.",
        farol_baixo_esq: "Farol Baixo Esq.",
        farol_baixo_dir: "Farol Baixo Dir.",
        farol_alto_esq: "Farol Alto Esq.",
        farol_alto_dir: "Farol Alto Dir.",
        pisca_dianteiro_esq: "Pisca Diant. Esq.",
        pisca_dianteiro_dir: "Pisca Diant. Dir.",
        lanterna_traseira_esq: "Lanterna Tras. Esq.",
        lanterna_traseira_dir: "Lanterna Tras. Dir.",
        freio_esq: "Luz Freio Esq.",
        freio_dir: "Luz Freio Dir.",
        luz_re: "Luz de Ré",
        luz_placa: "Luz da Placa",
        pisca_traseiro_esq: "Pisca Tras. Esq.",
        pisca_traseiro_dir: "Pisca Tras. Dir.",
        aperto_porcas: "Aperto das Porcas (Visual)",
        nivel_oleo: "Nível Óleo Motor",
        nivel_agua: "Nível Água Radiador",
        nivel_limpador: "Nível Água Limpador",
        freio_servico: "Freio de Serviço",
        freio_estacionamento: "Freio Estacionamento",
        buzina: "Buzina",
        limpadores: "Limpadores Para-brisa",
        espelhos_vidros: "Espelhos/Vidros",
        triangulo: "Triângulo",
        chave_rodas: "Chave de Rodas",
        macaco: "Macaco",
        extintor: "Extintor",
        licenciamento: "Licenciamento (CRLV)",
        aet: "AET",
        tacografo: "Aferição Tacógrafo"
    };

    // --- FUNÇÕES AUXILIARES ---

    function showStep(stepId) {
        steps.forEach((step) => {
            step.classList.toggle('active', step.id === stepId);
            step.classList.toggle('hidden', step.id !== stepId);
        });
        currentStepId = stepId;
        window.scrollTo(0, 0);
    }

    function validateChecklistForm(form) {
        const items = form.querySelectorAll('.item');
        for (const item of items) {
            const radios = item.querySelectorAll('input[type="radio"]');
            if (radios.length === 0) continue; 
            const name = radios[0].name;
            if (!form.elements[name].value) {
                const labelElement = item.querySelector('label');
                const labelText = labelElement ? labelElement.textContent.replace(':', '') : name;
                alert(`Por favor, selecione uma opção para "${labelText}."`);
                return false;
            }
        }
        return true;
    }

    function collectStepData(form) {
        const formData = new FormData(form);
        if (form.classList.contains('tire-form')) {
            checklistData.tires = {};
            const tirePositions = form.querySelectorAll('.tire-position');
            tirePositions.forEach(pos => {
                const positionName = pos.dataset.position;
                checklistData.tires[positionName] = {
                    f: parseFloat(form.elements[`pneu_${positionName}_f`].value) || 0,
                    m: parseFloat(form.elements[`pneu_${positionName}_m`].value) || 0,
                    d: parseFloat(form.elements[`pneu_${positionName}_d`].value) || 0
                };
            });
        } else if (form.id === 'obs-form') {
            checklistData.observacoes = form.elements['observacoes_manuais'].value;
        } else {
            formData.forEach((value, key) => {
                if (key !== 'truck_type') {
                    checklistData.items[key] = value;
                }
            });
        }
    }
    
    function getDefectsList() {
        let defects = [];
        for (const key in itemLabels) {
            if (checklistData.items.hasOwnProperty(key)) {
                const value = checklistData.items[key];
                if (value !== 'OK' && value !== 'N/A') {
                    defects.push(`${itemLabels[key]}: ${value}`);
                }
            }
        }
        return defects;
    }

    function analyzeTires() {
        let tireWarnings = [];
        const LIMITE_PROFUNDIDADE = 4;
        const LIMITE_DESGASTE = 2; 

        for (const pos in checklistData.tires) {
            const tire = checklistData.tires[pos];
            if (isNaN(tire.f) || isNaN(tire.m) || isNaN(tire.d)) continue; 
            const minDepth = Math.min(tire.f, tire.m, tire.d);
            const wearDiff = Math.abs(tire.f - tire.d);

            if (minDepth < LIMITE_PROFUNDIDADE) {
                tireWarnings.push(`Pneu ${pos}: Profundidade baixa (${minDepth}mm). RECOMENDAR RECAPAGEM.`);
            }
            if (wearDiff > LIMITE_DESGASTE) {
                tireWarnings.push(`Pneu ${pos}: Desgaste irregular (F:${tire.f}mm / D:${tire.d}mm). VERIFICAR ALINHAMENTO/SUSPENSÃO.`);
            }
        }
        return tireWarnings;
    }

    function showSummary() {
        checklistData.dateTime = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        summaryPlate.textContent = checklistData.plate;
        summaryTruckType.textContent = checklistData.truckType === 'toco' ? 'Toco (2 Eixos)' : 'Trucado (3 Eixos)';
        summaryDateTime.textContent = checklistData.dateTime;
        
        const defects = getDefectsList();
        if (defects.length > 0) {
            summaryItems.innerHTML = '<h3>Itens Gerais Irregulares:</h3>';
            defects.forEach(defect => {
                summaryItems.innerHTML += `<div class="item status-defeito">${defect}</div>`;
            });
        } else {
            summaryItems.innerHTML = '<h3>Itens Gerais:</h3><div class="item status-ok">Nenhum item geral irregular.</div>';
        }

        summaryTires.innerHTML = '<h3>Medição Pneus (F/M/D mm):</h3>';
        for(const position in checklistData.tires) {
            const tire = checklistData.tires[position];
            summaryTires.innerHTML += `<div class="tire-summary-item"><label>${position}:</label> <span>${tire.f} / ${tire.m} / ${tire.d}</span></div>`;
        }
        
        const tireAnalysis = analyzeTires();
        const manualObs = checklistData.observacoes;
        summaryObs.innerHTML = '<h4>Observações e Análise:</h4>';
        let obsText = '';
        if (tireAnalysis.length > 0) {
            obsText += `ANÁLISE AUTOMÁTICA DE PNEUS:\n${tireAnalysis.join('\n')}\n\n`;
        }
        if (manualObs) {
            obsText += `OBSERVAÇÕES DO OPERADOR:\n${manualObs}`;
        }
        summaryObs.innerHTML += `<p>${obsText || 'Nenhuma observação.'}</p>`;

        showStep('step-8');
    }

    // PDF apenas com defeitos
    function generatePDF() {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        let y = 15;
        const margin = 15;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const lineHeight = 6;
        const signatureHeight = 60; 

        const checkNewPage = (neededHeight = lineHeight) => {
            if (y + neededHeight > pageHeight - margin) {
                pdf.addPage();
                y = margin;
            }
        };

        // --- CABEÇALHO DO PDF COM LOGO ---
        let logoAdicionada = false;
        // @ts-ignore
        if (typeof LOGO_BASE64_STRING !== 'undefined' && LOGO_BASE64_STRING.startsWith('data:image')) {
            try {
                // @ts-ignore
                pdf.addImage(LOGO_BASE64_STRING, 'JPEG', margin, y, 50, 15); // Ajuste 50 (largura) e 15 (altura)
                logoAdicionada = true;
            } catch (e) {
                console.error("Erro ao adicionar imagem Base64 (verifique a string no logo.js):", e);
            }
        }

        if (!logoAdicionada) {
            pdf.setFontSize(12).text("MSG INDUSTRIA E COMERCIO DE ALIMENTOS LTDA", margin, y + 7);
        }
        
        pdf.setFontSize(10);
        pdf.setTextColor(100); // cinza
        pdf.text("MSG INDUSTRIA E COMERCIO DE ALIMENTOS LTDA", pageWidth - margin, y + 7, { align: 'right' });
        y += 20;

        // Título Principal
        pdf.setFontSize(18); 
        pdf.setTextColor(0); // Volta para preto
        pdf.text('Checklist Pré-Viagem (Relatório de Irregularidades)', pageWidth / 2, y, { align: 'center' }); 
        y += 12;

        // Informações do Veículo
        pdf.setFontSize(12);
        pdf.text(`Placa: ${checklistData.plate}`, margin, y);
        pdf.text(`Tipo: ${summaryTruckType.textContent}`, pageWidth / 2, y, { align: 'center'});
        pdf.text(`Data/Hora: ${checklistData.dateTime}`, pageWidth - margin, y, { align: 'right'});
        y += 15;

        // --- RESTO DO PDF ---
        const defects = getDefectsList();
        if (defects.length > 0) {
            pdf.setFontSize(14); pdf.text('Itens Gerais Irregulares:', margin, y); y += 8;
            pdf.setFontSize(10);
            defects.forEach(defect => {
                checkNewPage();
                pdf.setTextColor(231, 76, 60); // Vermelho
                const lines = pdf.splitTextToSize(defect, pageWidth - margin * 2);
                pdf.text(lines, margin, y);
                y += (lines.length * lineHeight);
            });
        } else {
            pdf.setFontSize(14); pdf.text('Itens Gerais:', margin, y); y += 8;
            pdf.setFontSize(10); pdf.setTextColor(39, 174, 96); // Verde
            pdf.text('Todos os itens gerais estão OK.', margin, y);
            y += lineHeight;
        }
        
        checkNewPage(15);
        pdf.setTextColor(0); pdf.setFontSize(14);
        pdf.text('Medição Pneus (F/M/D mm):', margin, y); y += 8;
        pdf.setFontSize(10);
         for(const position in checklistData.tires) {
             checkNewPage();
             const tire = checklistData.tires[position];
             pdf.text(`${position}:`, margin, y);
             pdf.text(`${tire.f} / ${tire.m} / ${tire.d}`, pageWidth - margin, y, { align: 'right' });
             y += lineHeight;
         }

        checkNewPage(15);
        pdf.setTextColor(0); pdf.setFontSize(14);
        pdf.text('Observações e Análise:', margin, y); y += 8;
        pdf.setFontSize(10);
        const tireAnalysis = analyzeTires();
        let obsText = '';
        if (tireAnalysis.length > 0) obsText += `ANÁLISE DE PNEUS:\n${tireAnalysis.join('\n')}\n\n`;
        if (checklistData.observacoes) obsText += `OBSERVAÇÕES DO OPERADOR:\n${checklistData.observacoes}`;
        if (!obsText) obsText = 'Nenhuma observação.';
        
        const obsLines = pdf.splitTextToSize(obsText, pageWidth - margin * 2);
        checkNewPage(obsLines.length * lineHeight);
        pdf.text(obsLines, margin, y);
        y += (obsLines.length * lineHeight);

        checkNewPage(signatureHeight);
        pdf.setTextColor(0); pdf.setFontSize(11);
        const sigY = y + 10;
        pdf.text('_________________________', margin, sigY + 10);
        pdf.text('Responsável Checklist', margin, sigY + 15);
        pdf.text('_________________________', margin, sigY + 30);
        pdf.text('Motorista', margin, sigY + 35);
        pdf.text('_________________________', margin, sigY + 50);
        pdf.text('Gerente/Encarregado', margin, sigY + 55);

        pdf.save(`checklist_${checklistData.plate}_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    // WhatsApp apenas com defeitos
    function shareViaWhatsApp() {
        const phoneNumber = '5588992559909';
        let message = `*Checklist Veículo - Placa: ${checklistData.plate}*\n`;
        message += `*Tipo:* ${summaryTruckType.textContent}\n`;
        message += `*Data/Hora:* ${checklistData.dateTime}\n`;
        
        const defects = getDefectsList();
        const tireAnalysis = analyzeTires();
        let hasDefect = defects.length > 0 || tireAnalysis.length > 0;

        if(hasDefect) {
            message = `*ATENÇÃO: VEÍCULO COM PENDÊNCIAS!*\n\n` + message;
            message += "\n*Resumo de Irregularidades:*\n";
            defects.forEach(defect => {
                message += `- ${defect} ⚠️\n`;
            });
        } else {
            message += "\n*Status: Veículo 100% OK!*\n";
        }
        
        if (tireAnalysis.length > 0) {
            message += "\n*Análise de Pneus:*\n";
            tireAnalysis.forEach(warning => {
                message += `- ${warning}\n`;
            });
        }
        
        if (checklistData.observacoes) {
            message += "\n*Observações do Operador:*\n" + checklistData.observacoes + "\n";
        }
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }


    // --- EVENT LISTENERS ---
    startButton.addEventListener('click', () => {
        const plateValue = plateInput.value.trim().toUpperCase();
        if (!plateValue.match(/^[A-Z]{3}-?\d{4}$/) && !plateValue.match(/^[A-Z]{3}\d[A-Z]\d{2}$/)) {
            alert('Formato de placa inválido. Use AAA-1234 ou AAA1B34.');
            return;
        }
        checklistData.plate = plateValue;
        showStep('step-1');
    });

    startTireCheckBtn.addEventListener('click', () => {
        const selectedType = truckTypeForm.elements['truck_type'].value;
        if (!selectedType) {
            alert('Por favor, selecione o tipo de veículo.');
            return;
        }
        checklistData.truckType = selectedType;
        collectStepData(truckTypeForm);
        showStep(selectedType === 'toco' ? 'step-3-toco' : 'step-3-trucado');
    });
    
    document.querySelectorAll('.checklist-form:not(.tire-form):not(#obs-form) .next-btn').forEach(button => {
        button.addEventListener('click', () => {
            const currentForm = document.getElementById(currentStepId).querySelector('form');
            if (validateChecklistForm(currentForm)) {
                collectStepData(currentForm);
                 const currentStepNum = parseInt(currentStepId.split('-')[1]);
                 
                 if (currentStepId === 'step-6') {
                    autoDefectsList.textContent = getDefectsList().join('\n') || 'Nenhum defeito encontrado.';
                    tireAnalysisList.textContent = analyzeTires().join('\n') || 'Nenhuma observação de pneu.';
                    showStep('step-7');
                 } else {
                     showStep(`step-${currentStepNum + 1}`);
                 }
            }
        });
    });
    
    tireForms.forEach(form => {
        const nextBtn = form.querySelector('.next-btn');
        nextBtn.addEventListener('click', () => {
             const inputs = form.querySelectorAll('input[type="number"]');
             for (const input of inputs) {
                if (input.value === '') {
                    alert('Por favor, preencha todas as 3 medidas para cada pneu.');
                    input.focus();
                    return;
                }
             }
             collectStepData(form);
             showStep('step-4');
        });
    });

    obsForm.querySelector('.next-btn').addEventListener('click', () => {
        collectStepData(obsForm);
        showSummary();
    });

    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
             const targetStepId = button.dataset.target ? `step-${button.dataset.target}` : null;
             
             if (targetStepId) {
                 showStep(targetStepId);
             } else if (currentStepId === 'step-4') {
                 showStep(checklistData.truckType === 'toco' ? 'step-3-toco' : 'step-3-trucado');
             } else if (currentStepId === 'step-8') {
                 showStep('step-7');
             } else {
                 const currentStepNum = parseInt(currentStepId.split('-')[1]);
                 if (currentStepNum > 0) {
                     showStep(`step-${currentStepNum - 1}`);
                 }
             }
        });
    });

    pdfButton.addEventListener('click', generatePDF);
    whatsappButton.addEventListener('click', shareViaWhatsApp);
    restartButton.addEventListener('click', () => {
         Object.keys(checklistData.items).forEach(key => delete checklistData.items[key]);
         Object.keys(checklistData.tires).forEach(key => delete checklistData.tires[key]);
         checklistData.observacoes = '';
         plateInput.value = '';
         document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
         document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
         document.getElementById('observacoes_manuais').value = '';
         showStep('step-0');
    });

    // --- INICIALIZAÇÃO ---
    showStep('step-0');
    
    // --- Registro do Service Worker ---
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('Service Worker registrado com sucesso.'))
          .catch(err => console.error('Falha ao registrar Service Worker:', err));
      });
    }
});
import React, { useState } from 'react';
import { jsPDF } from "jspdf";

export default function App() {
  const [dados, setDados] = useState({ 
    salario: '', admissao: '', demissao: '', avisoPrevio: false 
  });
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const { salario, admissao, demissao, avisoPrevio } = dados;
    
    if (!salario || !admissao || !demissao) {
      return alert("Por favor, preencha todos os campos.");
    }
    
    const inicio = new Date(admissao);
    const fim = new Date(demissao);
    const valorSalario = Number(salario.replace(",", "."));

    if (fim < inicio) {
      return alert("A data de demissão não pode ser anterior à data de admissão.");
    }

    // Lógica de meses proporcionais
    let meses = (fim.getFullYear() - inicio.getFullYear()) * 12;
    meses += fim.getMonth() - inicio.getMonth();
    if (fim.getDate() >= 15) meses += 1;
    if (meses < 1) meses = 1; // garante pelo menos 1 mês proporcional

    // Parcelas
    const decimoTerceiro = (valorSalario / 12) * meses;
    const ferias = ((valorSalario / 12) * meses) * (4/3); // mais preciso que 1.3333
    const fgtsMensal = valorSalario * 0.08 * meses;
    const multaFgts = fgtsMensal * 0.40;
    const valorAviso = avisoPrevio ? valorSalario : 0;
    
    const total = decimoTerceiro + ferias + fgtsMensal + multaFgts + valorAviso;

    setResultado({ 
      meses, 
      decimoTerceiro: decimoTerceiro.toFixed(2), 
      ferias: ferias.toFixed(2), 
      fgts: (fgtsMensal + multaFgts).toFixed(2),
      aviso: valorAviso.toFixed(2),
      total: total.toFixed(2) 
    });
  };

  const gerarPDF = () => {
    if (!resultado) {
      return alert("Calcule a estimativa antes de gerar o PDF.");
    }

    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Estimativa de Verbas Rescisórias", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Salário Base: R$ ${dados.salario}`, 20, 35);
    doc.text(`Período: ${dados.admissao} até ${dados.demissao}`, 20, 42);
    
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);

    const yStart = 60;
    doc.text(`Meses Proporcionais:`, 20, yStart); doc.text(`${resultado.meses}`, 150, yStart);
    doc.text(`13º Salário Proporcional:`, 20, yStart + 10); doc.text(`R$ ${resultado.decimoTerceiro}`, 150, yStart + 10);
    doc.text(`Férias + 1/3 Proporcional:`, 20, yStart + 20); doc.text(`R$ ${resultado.ferias}`, 150, yStart + 20);
    doc.text(`FGTS + Multa (40%):`, 20, yStart + 30); doc.text(`R$ ${resultado.fgts}`, 150, yStart + 30);
    
    if (dados.avisoPrevio) {
      doc.text(`Aviso Prévio Indenizado:`, 20, yStart + 40); doc.text(`R$ ${resultado.aviso}`, 150, yStart + 40);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`TOTAL ESTIMADO (BRUTO):`, 20, yStart + 60); doc.text(`R$ ${resultado.total}`, 150, yStart + 60);

    // Nota de rodapé
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(100);
    const nota = "Este documento é uma simulação para fins de negociação extrajudicial. Valores brutos sem descontos de INSS/IRRF.";
    doc.text(nota, 20, 285);

    doc.save("estimativa_rescisao.pdf");
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Simulador de Acordo</h2>
        
        <div style={styles.inputGroup}>
          <label style={styles.label}>Salário Bruto Mensal</label>
          <input 
            type="number" 
            style={styles.input} 
            value={dados.salario} 
            onChange={e => setDados({...dados, salario: e.target.value})} 
            placeholder="0.00" 
          />
        </div>

        <div style={styles.rowInputs}>
          <div style={{flex: 1, marginRight: '10px'}}>
            <label style={styles.label}>Admissão</label>
            <input 
              type="date" 
              style={styles.input} 
              value={dados.admissao} 
              onChange={e => setDados({...dados, admissao: e.target.value})} 
            />
          </div>
          <div style={{flex: 1}}>
            <label style={styles.label}>Demissão</label>
            <input 
              type="date" 
              style={styles.input} 
              value={dados.demissao} 
              onChange={e => setDados({...dados, demissao: e.target.value})} 
            />
          </div>
        </div>

        <div style={styles.checkboxGroup}>
          <input 
            type="checkbox" 
            id="aviso" 
            checked={dados.avisoPrevio} 
            onChange={e => setDados({...dados, avisoPrevio: e.target.checked})} 
          />
          <label htmlFor="aviso" style={{marginLeft: '8px', fontSize: '0.9rem'}}>
            Incluir Aviso Prévio Indenizado
          </label>
        </div>

        <button onClick={calcular} style={styles.button}>Calcular Estimativa</button>

        {resultado && (
          <div style={styles.resultContainer}>
            <div style={styles.totalBox}>
              <span style={{fontSize: '0.9rem', color: '#666'}}>Total Bruto</span>
              <div style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#111'}}>
                R$ {resultado.total}
              </div>
            </div>
            
            <div>Aviso Prévio: R$ {resultado.aviso}</div> 

            <button onClick={gerarPDF} style={styles.pdfButton}>
              Exportar PDF para Negociação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5', padding: '20px' },
  card: { backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: '450px', fontFamily: 'system-ui, sans-serif' },
  title: { textAlign: 'center', marginBottom: '25px', color: '#1a1a1a', fontWeight: '800' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#444', marginBottom: '5px' },
  inputGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
  rowInputs: { display: 'flex', marginBottom: '20px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', width: '100%', boxSizing: 'border-box' },
  checkboxGroup: { marginBottom: '25px', display: 'flex', alignItems: 'center' },
  button: { width: '100%', padding: '14px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' },
  resultContainer: { marginTop: '25px', borderTop: '1px solid #eee', paddingTop: '20px' },
  totalBox: { textAlign: 'center', marginBottom: '15px', padding: '15px', backgroundColor: '#f8f

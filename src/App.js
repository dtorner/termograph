import React, { useState, useRef } from "react";
import jsPDF from "jspdf";

export default function TermoReportApp() {
  const [projectName, setProjectName] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const [images, setImages] = useState([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState(null);
  const [annotations, setAnnotations] = useState({}); // { imgIndex: [{x,y,text}, ...] }

  const imgContainerRef = useRef(null);

  // Subir imágenes
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setImages((imgs) => [...imgs, ...newImages]);
  };

  // Añadir anotación al hacer click en la imagen
  const handleImageClick = (e) => {
    if (selectedImgIndex === null) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const text = prompt("Texto para la anotación (temperatura, observación, etc.)");
    if (!text) return;

    setAnnotations((ann) => {
      const imgAnns = ann[selectedImgIndex] || [];
      return {
        ...ann,
        [selectedImgIndex]: [...imgAnns, { x, y, text }],
      };
    });
  };

  // Generar PDF
  const generatePDF = () => {
    const pdf = new jsPDF();

    pdf.setFontSize(18);
    pdf.text(projectName || "Informe Termográfico", 10, 20);
    pdf.setFontSize(12);
    pdf.text(`Fecha: ${date}`, 10, 30);
    pdf.text("Descripción:", 10, 40);
    pdf.setFontSize(10);
    pdf.text(description || "-", 10, 47, { maxWidth: 190 });

    let yOffset = 60;

    images.forEach((src, idx) => {
      pdf.addPage();
      pdf.setFontSize(14);
      pdf.text(`Imagen ${idx + 1}`, 10, 15);
      pdf.addImage(src, "JPEG", 10, 20, 180, 100);

      // Dibujar anotaciones
      const imgAnns = annotations[idx] || [];
      imgAnns.forEach(({ x, y, text }) => {
        // Ajustar escala por tamaño imagen (asumimos 180x100)
        const scaleX = 180 / imgContainerRef.current.offsetWidth;
        const scaleY = 100 / imgContainerRef.current.offsetHeight;
        pdf.setDrawColor(255, 0, 0);
        pdf.circle(10 + x * scaleX, 20 + y * scaleY, 3, "F");
        pdf.setTextColor(255, 0, 0);
        pdf.text(text, 15 + x * scaleX, 20 + y * scaleY);
      });
    });

    pdf.addPage();
    pdf.setFontSize(14);
    pdf.setTextColor(0);
    pdf.text("Recomendaciones:", 10, 20);
    pdf.setFontSize(12);
    pdf.text(recommendations || "-", 10, 30, { maxWidth: 190 });

    pdf.save("informe_termografico.pdf");
  };

  return (
    <div style={{ maxWidth: 900, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Generador de Informe Termográfico</h1>

      <label>
        Nombre del proyecto:
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
      </label>

      <label>
        Fecha:
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
      </label>

      <label>
        Descripción:
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ width: "100%", marginBottom: 12 }}
        />
      </label>

      <label>
        Subir imágenes termográficas:
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
      </label>

      <div
        ref={imgContainerRef}
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          marginTop: 12,
          border: "1px solid #ddd",
          padding: 8,
          height: 150,
        }}
      >
        {images.map((src, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img
              src={src}
              alt={`Termo ${i + 1}`}
              style={{
                height: 130,
                border: i === selectedImgIndex ? "3px solid #007bff" : "1px solid #ccc",
                cursor: "pointer",
                objectFit: "contain",
              }}
              onClick={() => setSelectedImgIndex(i)}
            />
            {(annotations[i] || []).map(({ x, y }, idx) => (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  top: y - 6,
                  left: x - 6,
                  width: 12,
                  height: 12,
                  backgroundColor: "red",
                  borderRadius: "50%",
                  pointerEvents: "none",
                }}
                title={(annotations[i][idx] || {}).text}
              />
            ))}
          </div>
        ))}
      </div>

      {selectedImgIndex !== null && (
        <div style={{ marginTop: 8 }}>
          <p>
            Click en la imagen para agregar una anotación (temperatura u observación)
          </p>
          <img
            src={images[selectedImgIndex]}
            alt="Seleccionada"
            style={{ maxWidth: "100%", border: "1px solid #ccc", cursor: "crosshair" }}
            onClick={handleImageClick}
          />
        </div>
      )}

      <label style={{ marginTop: 16, display: "block" }}>
        Recomendaciones y conclusiones:
        <textarea
          value={recommendations}
          onChange={(e) => setRecommendations(e.target.value)}
          rows={4}
          style={{ width: "100%", marginBottom: 16 }}
        />
      </label>

      <button onClick={generatePDF} style={{ padding: "10px 20px", fontSize: 16 }}>
        Generar PDF
      </button>
    </div>
  );
}
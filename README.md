# 📚 BiblioDivergente — Lectura Accesible

Hola! 👋 Bienvenido a mi repositorio! 

Soy Aylén Frísoli y este proyecto es mi entrega final para el curso de **Inteligencia Artificial Generativa** dictado en conjunto por **Eidos, Google y ADA ITW**. Elegí el **Camino Técnico**, con el objetivo de presentar un MVP funcional con componentes de IA y prototipar una web que resuelva un problema específico y real.

**BiblioDivergente** es una biblioteca digital y motor de recomendación que no solo sugiere qué leer, sino que adapta la forma en que presenta esa información según las necesidades cognitivas de cada persona. 

---

[🔗 Visitar BiblioDivergente](https://biblioneurodivergente.vercel.app/)

---

## 🤔 El problema (y mi experiencia personal)

Como persona con dislexia, muchas veces me encuentro con la dificultad de enfoque y comprensión lectora. Esa experiencia propia fue la que me llevó a detectar una necesidad que suele ignorarse: **las personas neurodivergentes no tienen espacios de recomendación de libros que hablen su idioma.** La mayoría de las plataformas literarias asumen un perfil lector único, lineal y sin fricciones. Presentan "muros de texto" que pueden generar ansiedad o fatiga visual, excluyendo silenciosamente a quienes procesan la información de otra manera.

---

## ✨ La solución y Empatía Técnica

Intenté aplicar la empatía directamente desde la arquitectura de la aplicación:

1. **Recomendaciones con propósito:** El buscador de IA no solo recomienda libros basándose en los intereses del usuario, sino que etiqueta cada uno (`fit`) indicando qué tipo de mente se beneficia más de él (ej. "Para mente TDAH", "Para dislexia").
2. **Panel de Accesibilidad en tiempo real:** Desarrollé un panel que permite cambiar la paleta de colores, la fuente de lectura y el contraste sin recargar la página. Para alguien con hipersensibilidad visual, estas variables no son simple estética, **son inclusión**.
3. **Próximos pasos (Feature en desarrollo):** Me queda pendiente sumar la capacidad de que el usuario pueda subir su propio archivo de texto, para que puedan utilizar este visualizador y sus configuraciones siempre que quieran leer algo externo.

---

## 🛠️ Stack técnico y Herramientas

| Capa | Tecnología / Herramienta |
|---|---|
| **Asistente de IA** | Claude Code — arquitectura, código frontend y serverless |
| **Motor IA** | Groq API — motor de recomendación y simplificación de sinopsis |
| **Frontend** | HTML5 + Tailwind CSS + Vanilla JS |
| **Tipografía accesible** | Google Fonts |
| **Deploy** | Vercel |

---

## 🧠 El Prompt Maestro

Este es el *System Prompt* del backend (`api/recommend.js`). Es la pieza más compleja del proyecto porque define toda la lógica de personalización para mentes neurodivergentes. 

Combina una restricción de formato estricta, tono empático, límite de palabras por campo y especificidad de perfiles neurodivergentes, todo en un solo comando que le da identidad al producto:

```text
Sos el bibliotecario de BiblioDivergente, una biblioteca digital para mentes neurodivergentes. 
Dado el interés del usuario, recomendá 4 libros reales en español (o traducidos al español).

Para cada libro devolvé un objeto con exactamente estas claves:
- "title": título del libro
- "author": autor/a
- "year": año de publicación original como string corto (ej "1984", "2010")
- "why": una razón cálida y poética de máximo 22 palabras en español, explicando por qué este libro va bien con la búsqueda
- "fit": etiqueta breve de qué mente le va mejor (ej "Para mente TDAH", "Para lectura ansiosa", "Para procesamiento literal", "Para hipersensibilidad visual", "Para diversidad cultural", "Para dislexia")

Devolvé EXCLUSIVAMENTE un JSON válido con esta forma exacta:
{"books":[{"title":"...","author":"...","year":"...","why":"...","fit":"..."}]}

## Reflexión Final: La IA como acelerador

Lo que descubrí sobre mi potencial creativo durante este mes es que **la IA no reemplazó mis decisiones, las aceleró**. 

Al apoyarme en herramientas generativas para el código y la estructura, pude dirigir toda mi energía a lo que más me importa como desarrolladora: **pensar en el usuario real**. Logré construir algo funcional, desplegado y con un propósito claro, confirmando una lección invaluable de este curso: **la empatía es también una habilidad técnica**.
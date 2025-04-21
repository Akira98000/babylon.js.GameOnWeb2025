const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function sliceImage(inputPath, outputDir) {
    try {
        // Créer le dossier de sortie s'il n'existe pas
        await fs.mkdir(outputDir, { recursive: true });

        // Charger l'image
        const image = sharp(inputPath);
        const metadata = await image.metadata();

        // Calculer la taille de chaque pièce
        const pieceWidth = Math.floor(metadata.width / 3);
        const pieceHeight = Math.floor(metadata.height / 3);

        // Découper l'image en 9 morceaux
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const pieceNumber = row * 3 + col + 1;
                const left = col * pieceWidth;
                const top = row * pieceHeight;

                await image
                    .extract({
                        left: left,
                        top: top,
                        width: pieceWidth,
                        height: pieceHeight
                    })
                    .toFile(path.join(outputDir, `fusee_piece_${pieceNumber}.jpg`));
            }
        }

        console.log('Image découpée avec succès !');
    } catch (error) {
        console.error('Erreur lors du découpage de l\'image :', error);
    }
}

// Utilisation :
const inputImagePath = path.join(__dirname, '../../public/images/fusee.jpg');
const outputDirectory = path.join(__dirname, '../../public/images');

sliceImage(inputImagePath, outputDirectory); 
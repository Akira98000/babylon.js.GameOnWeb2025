import * as BABYLON from '@babylonjs/core'

export const createHorrorMusic = (scene) => {
    const horrorMusic = new BABYLON.Sound(
      "horrorMusic",
      "/assets/horror.mp3",
      scene,
      () => {
        console.log("Musique d'horreur chargée")
        horrorMusic.loop = true
        horrorMusic.play()
      },
      { volume: 0.5, autoplay: false, spatialSound: false }
    )

    const salsaMusic = new BABYLON.Sound(
      "salsaMusic",
      "/public/assets/salsa.mp3",
      scene,
      () => {
        console.log("Musique de salsa chargée")
        salsaMusic.loop = true
        salsaMusic.play()
      },
      { volume: 0.5, autoplay: false, spatialSound: false }
    )

    horrorMusic.setVolume(0, 0)
    salsaMusic.setVolume(0, 0)

    let currentVolume = 0
    const targetVolume = 0.5
    const fadeInInterval = setInterval(() => {
      currentVolume += 0.01
      if (currentVolume >= targetVolume) {
        currentVolume = targetVolume
        clearInterval(fadeInInterval)
      }
      horrorMusic.setVolume(currentVolume)
      salsaMusic.setVolume(currentVolume)
    }, 100)

    return { horrorMusic, salsaMusic }
}

# EUR-RON és USD-RON árfolyamelemzés

Ez a webes alkalmazás az EUR-RON és USD-RON árfolyamok vizualizációját teszi lehetővé különböző diagramok segítségével.

## Használat

1. Nyissa meg az `index.html` fájlt egy böngészőben
2. Kattintson a "Tallózás" gombra és válassza ki az Excel fájlt, amely tartalmazza az árfolyamadatokat
3. Kattintson az "Adatok betöltése" gombra
4. Váltson a különböző diagramok között a gombok segítségével

## Excel fájl formátum

Az alkalmazás a következő formátumú Excel fájlokat tudja kezelni:

- A fájlnak tartalmaznia kell egy munkalapot az árfolyamadatokkal
- Az adatoknak a következő oszlopokkal kell rendelkezniük:
  - Dátum (elfogadott formátumok: ÉÉÉÉ-HH-NN, NN.HH.ÉÉÉÉ, NN/HH/ÉÉÉÉ)
  - EUR árfolyam
  - USD árfolyam

Példa a fájl struktúrájára:

| Dátum | EUR | USD |
|-------|-----|-----|
| 2021.04.26 | 4.92 | 4.08 |
| 2021.05.03 | 4.93 | 4.10 |
| ... | ... | ... |

## Vizualizációk

Az alkalmazás három különböző típusú vizualizációt kínál:

1. **EUR-RON és USD-RON árfolyam 2021.04.26 - 2025.04.24 között**: Vonaldiagram, amely az árfolyamok időbeli változását mutatja.
2. **EUR és USD árfolyam-változás**: Oszlopdiagram, amely az árfolyamok százalékos változását mutatja az előző adatponthoz képest.
3. **Árfolyam-eloszlás**: Hisztogram, amely az árfolyamértékek eloszlását mutatja be.

## Fejlesztők

- Bak-Menyhárt Sándor
- Papp Szabolcs 
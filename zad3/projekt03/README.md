Autor: Jakub Klimecki
Port: 8000

Opis

Aplikacja internetowa do przechowywania i zarządzania informacjami.
Stworzony serwer HTTP w Express z dynamicznymi widokami EJS.
Aplikacja pozwala dodawać, edytować i usuwać elementy przez intuicyjny interfejs.

Uruchomienie

Otwórz terminal w folderze projektu

Wpisz:

npm install
npm start

Otwórz przeglądarkę i wejdź na:
http://localhost:8000

Obsługiwane ścieżki

GET / – strona główna z listą elementów

GET /items – lista wszystkich elementów

POST /items – dodanie nowego elementu

GET /items/edit/:id – formularz edycji elementu

POST /items/edit/:id – zapisanie zmian w elemencie

GET /items/delete/:id – usunięcie elementu

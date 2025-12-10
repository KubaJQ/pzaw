Autor: Jakub Klimecki
Port: 8000

Opis

Prosty serwer HTTP stworzony w Express z dynamicznymi widokami EJS.
Aplikacja pozwala dodawać wiadomości przez formularz, które wyświetlają się na stronie głównej.

Uruchomienie

Otwórz terminal w folderze projektu

Wpisz:

npm install
node index.js


Otwórz przeglądarkę i wejdź na:
http://localhost:8000

Obsługiwane ścieżki

GET / – strona główna z listą wiadomości

GET /messages – lista wszystkich wiadomości

POST /messages – dodanie nowej wiadomości
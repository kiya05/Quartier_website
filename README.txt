QUARTIER WEBSITE — EDITABLE VERSION

Files:
- index.html          Home page
- projects.html       Projects page
- services.html       Services page
- about.html          About page
- team.html           Team page
- contact.html        Contact page
- start-project.html  Project enquiry page
- style.css           ALL shared styling
- script.js           Menu, scroll and animations
- quartier-logo.png   Your supplied logo with transparent background

HOW TO EDIT:
1. Open the folder in VS Code.
2. Change text directly in each HTML page.
3. Change colors/fonts in :root at the top of style.css.
4. Replace background/image URLs in style.css or the HTML cards.
5. Add projects by copying a project-card block in projects.html.
6. Add team members by copying a team-card block in team.html.
7. The forms currently show a demo success message. For real collection, connect their form action to your PHP backend (submit-contact.php / submit-project.php) as discussed.

LOCAL TESTING:
You can use VS Code Live Server for the front-end.
For PHP/MySQL, use XAMPP and open the project through http://localhost/...


FOOTER UPDATE:
- Fixed footer selectors so typography and links display correctly.
- Added animated reveal, hover lines, gold glow, social links and Back to Top.
- Footer is responsive on tablet/mobile.


CUSTOM CURSOR:
- A minimal gold dot + soft ring cursor is included in style.css and script.js.
- On buttons/links it gently expands.
- On project/team images it becomes a subtle larger lens.
- It automatically turns off on phones/tablets with touch input.
- You can adjust the size, gold color and animation timing in the
  "MINIMAL LUXURY CUSTOM CURSOR" section of style.css.


PHONE VALIDATION UPDATE:
- Contact and Start Project forms now use country-specific phone rules.
- The helper text shows the selected country's dial code and expected example digit count when available.
- Invalid length shows a clear prompt such as: "India requires 10 digits. You entered 9."
- Non-numeric characters are rejected by intl-tel-input strict mode.
- The complete valid number is stored in E.164 format in the hidden phone_full field.


ANIMATED STATISTICS:
- The Home page numbers now count up when the statistics section enters the screen.
- Edit data-target in index.html to change a number.
- Edit data-suffix to change the suffix, such as + or %.


LATEST UPDATES:
- Statistics now use a visible increasing 0 → target count-up effect.
- Hero titles across all pages have been rewritten for a consistent premium tone.
- Hero title, italic text and supporting paragraph have staggered entrance animations.


FINAL TYPOGRAPHY FIX:
- Hero titles use Cormorant Garamond with safe line-height and width.
- Titles are shorter to prevent awkward wrapping.
- No fixed heights are used for headings, so text cannot be clipped.
- Mobile font sizes and spacing are adjusted separately.

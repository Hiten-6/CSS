document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const currentBooksBtn = document.getElementById('current-books-btn');
    const addBookBtn = document.getElementById('add-book-btn');
    const currentBooksView = document.getElementById('current-books-view');
    const addBookView = document.getElementById('add-book-view');

    const totalBooksCount = document.getElementById('total-books-count');
    const genresInStockCount = document.getElementById('genres-in-stock-count');
    const filteredResultsCount = document.getElementById('filtered-results-count');

    const searchInput = document.getElementById('search-input');
    const bookListContainer = document.getElementById('book-list-container');
    const noBooksMessage = document.getElementById('no-books-message');
    const noMatchMessage = document.getElementById('no-match-message');

    const bookForm = document.getElementById('book-form');
    const bookTitleInput = document.getElementById('book-title');
    const bookAuthorInput = document.getElementById('book-author');
    const bookGenreInput = document.getElementById('book-genre');
    const publicationYearInput = document.getElementById('publication-year');
    const isbnInput = document.getElementById('isbn');
    const submitBookBtn = document.getElementById('submit-book-btn');

    let books = []; // Array to hold our book objects
    let editingBookId = null; // To track if we are editing an existing book

    // --- Helper Function: Save/Load from LocalStorage ---
    function saveBooks() {
        localStorage.setItem('libraryBooks', JSON.stringify(books));
    }

    function loadBooks() {
        const storedBooks = localStorage.getItem('libraryBooks');
        if (storedBooks) {
            books = JSON.parse(storedBooks);
        } else {
            // Add some initial dummy data if no books are stored
            books = [
                { id: 'B' + Date.now() + 1, title: 'The Hobbit', author: 'J.R.R. Tolkien', genre: 'Fantasy', year: 1937, isbn: '978-0-345-33968-3' },
                { id: 'B' + Date.now() + 2, title: '1984', author: 'George Orwell', genre: 'Dystopian', year: 1949, isbn: '978-0-451-52493-5' },
                { id: 'B' + Date.now() + 3, title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Romance', year: 1813, isbn: '978-0-141-43951-8' }
            ];
            saveBooks();
        }
    }

    // --- UI Update Functions ---
    function updateSummaryCards(currentBooks) {
        totalBooksCount.textContent = books.length;
        
        const uniqueGenres = new Set(books.map(book => book.genre.toLowerCase()));
        genresInStockCount.textContent = uniqueGenres.size;
        
        filteredResultsCount.textContent = currentBooks.length;
    }

    function displayBooks(bookArray) {
        bookListContainer.innerHTML = ''; // Clear existing books
        noBooksMessage.style.display = 'none';
        noMatchMessage.style.display = 'none';

        if (books.length === 0) {
            noBooksMessage.style.display = 'block';
            updateSummaryCards([]); // No books, so filtered is also 0
            return;
        }

        if (bookArray.length === 0) {
            noMatchMessage.style.display = 'block';
            updateSummaryCards([]); // No matches, so filtered is 0
            return;
        }

        bookArray.forEach(book => {
            const bookItem = document.createElement('div');
            bookItem.className = 'book-item';
            bookItem.setAttribute('data-id', book.id); // Store book ID for reference

            bookItem.innerHTML = `
                <h3>${book.title}</h3>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>Publication Year:</strong> ${book.year}</p>
                <p class="genre-tag">${book.genre}</p>
                ${book.isbn ? `<p><strong>ISBN:</strong> ${book.isbn}</p>` : ''}
                <div class="book-actions">
                    <button class="action-icon edit-icon" data-id="${book.id}" title="Edit Book"><i class="fas fa-pencil-alt"></i></button>
                    <button class="action-icon delete-icon" data-id="${book.id}" title="Delete Book"><i class="fas fa-times"></i></button>
                </div>
            `;
            bookListContainer.appendChild(bookItem);
        });
        updateSummaryCards(bookArray); // Update counts based on currently displayed array
    }

    // --- Navigation Logic ---
    function showView(viewId) {
        document.querySelectorAll('.view-section').forEach(view => {
            view.classList.add('hidden');
        });
        document.getElementById(viewId).classList.remove('hidden');

        document.querySelectorAll('.nav-button').forEach(btn => {
            btn.classList.remove('active');
        });

        if (viewId === 'current-books-view') {
            currentBooksBtn.classList.add('active');
            displayBooks(applySearchFilter()); // Refresh display when navigating back to current books
        } else if (viewId === 'add-book-view') {
            addBookBtn.classList.add('active');
            resetForm(); // Clear form when navigating to add book view
        }
    }

    currentBooksBtn.addEventListener('click', () => showView('current-books-view'));
    addBookBtn.addEventListener('click', () => showView('add-book-view'));

    // --- Search/Filter Logic ---
    function applySearchFilter() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        if (!searchTerm) {
            return books; // If no search term, return all books
        }
        return books.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.genre.toLowerCase().includes(searchTerm)
        );
    }

    searchInput.addEventListener('input', () => {
        const filteredBooks = applySearchFilter();
        displayBooks(filteredBooks);
    });

    // --- Form Handling (Add/Edit Book) ---
    function generateBookId() {
        return 'B' + Date.now(); // Simple ID generation
    }

    function resetForm() {
        bookForm.reset();
        submitBookBtn.textContent = 'Add Book';
        editingBookId = null;
        bookTitleInput.focus();
    }

    bookForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent default form submission

        const newBook = {
            title: bookTitleInput.value.trim(),
            author: bookAuthorInput.value.trim(),
            genre: bookGenreInput.value.trim(),
            year: parseInt(publicationYearInput.value, 10),
            isbn: isbnInput.value.trim()
        };

        // Basic validation
        if (!newBook.title || !newBook.author || !newBook.genre || !newBook.year) {
            showAlert('Please fill in all required fields.', 'Error');
            return;
        }
        if (newBook.isbn && !/^(?:ISBN(?:-13)?:?)(?=[0-9]{13}$)([0-9]{3}-){2}[0-9]{3}[0-9X]$/.test(newBook.isbn)) {
            showAlert('Please enter a valid ISBN (e.g., 978-0-345-33968-3).', 'Error');
            return;
        }

        if (editingBookId) {
            // Edit existing book
            const index = books.findIndex(book => book.id === editingBookId);
            if (index !== -1) {
                books[index] = { ...books[index], ...newBook }; // Merge new data
                showAlert('Book updated successfully!', 'Success');
            }
        } else {
            // Add new book
            newBook.id = generateBookId();
            books.push(newBook);
            showAlert('Book added successfully! New Book ID: ' + newBook.id, 'Success');
        }

        saveBooks();
        resetForm();
        showView('current-books-view'); // Go back to book list after add/edit
    });

    // --- Edit/Delete Logic (Event Delegation) ---
    bookListContainer.addEventListener('click', (e) => {
        const bookId = e.target.closest('.book-item')?.dataset.id || e.target.dataset.id; // Get ID from item or button
        
        if (!bookId) return;

        if (e.target.closest('.edit-icon')) {
            editBook(bookId);
        } else if (e.target.closest('.delete-icon')) {
            confirmAction('Are you sure you want to delete this book?', () => deleteBook(bookId));
        }
    });

    function editBook(id) {
        const bookToEdit = books.find(book => book.id === id);
        if (bookToEdit) {
            bookTitleInput.value = bookToEdit.title;
            bookAuthorInput.value = bookToEdit.author;
            bookGenreInput.value = bookToEdit.genre;
            publicationYearInput.value = bookToEdit.year;
            isbnInput.value = bookToEdit.isbn || ''; // Handle optional ISBN
            
            submitBookBtn.textContent = 'Update Book';
            editingBookId = id;
            showView('add-book-view'); // Switch to the form view
        }
    }

    function deleteBook(id) {
        books = books.filter(book => book.id !== id);
        saveBooks();
        displayBooks(applySearchFilter()); // Re-render the list after deletion
        showAlert('Book deleted successfully!', 'Success');
    }


    // --- Custom Alert/Confirmation Dialog ---
    function showAlert(message, type = 'Info') {
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        
        const alertBox = document.createElement('div');
        alertBox.className = 'custom-alert-box';
        alertBox.innerHTML = `
            <h3>${type}</h3>
            <p>${message}</p>
            <div class="alert-buttons">
                <button class="alert-button ok-button">OK</button>
            </div>
        `;
        
        overlay.appendChild(alertBox);
        document.body.appendChild(overlay);

        alertBox.querySelector('.ok-button').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }

    function confirmAction(message, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'custom-alert-overlay';
        
        const alertBox = document.createElement('div');
        alertBox.className = 'custom-alert-box';
        alertBox.innerHTML = `
            <h3>Confirmation</h3>
            <p>${message}</p>
            <div class="alert-buttons">
                <button class="alert-button ok-button">OK</button>
                <button class="alert-button cancel-button">Cancel</button>
            </div>
        `;
        
        overlay.appendChild(alertBox);
        document.body.appendChild(overlay);

        alertBox.querySelector('.ok-button').addEventListener('click', () => {
            document.body.removeChild(overlay);
            onConfirm(); // Execute the provided callback function
        });

        alertBox.querySelector('.cancel-button').addEventListener('click', () => {
            document.body.removeChild(overlay);
        });
    }


    // --- Initial Setup ---
    loadBooks();
    displayBooks(books); // Display all books on load
    showView('current-books-view'); // Start on the current books tab
});
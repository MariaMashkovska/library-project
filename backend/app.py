from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import date, timedelta
from services.library_service import LibraryService
from models.book import Book, Genre
from models.reader import Reader, ReaderCategory
from models.rental import RentalStatus
from patterns.factory import StandardBookFactory, ReaderFactory
from database.db import init_db
import os

app = Flask(__name__)
CORS(app)

# Initialize database
init_db(app)

library = LibraryService()
book_factory = StandardBookFactory()


@app.route('/api/books', methods=['GET'])
def get_books():
    """Get all books or available books only"""
    available_only = request.args.get('available_only', 'false').lower() == 'true'
    
    if available_only:
        books = library.get_available_books()
    else:
        books = library.get_all_books()
    
    return jsonify([{
        'id': b.id,
        'title': b.title,
        'author': b.author,
        'genre': b.genre.value,
        'deposit_cost': b.deposit_cost,
        'base_rental_cost': b.base_rental_cost,
        'total_copies': b.total_copies,
        'available_copies': b.available_copies,
        'value': b.value,
        'is_available': b.is_available()
    } for b in books])


@app.route('/api/books', methods=['POST'])
def create_book():
    """Create a new book"""
    data = request.json
    
    try:
        genre = Genre[data['genre'].upper()] if isinstance(data['genre'], str) else Genre(data['genre'])
        book = book_factory.create_book(
            title=data['title'],
            author=data['author'],
            genre=genre,
            value=float(data['value']),
            copies=int(data['copies'])
        )
        book_id = library.add_book(book)
        return jsonify({'id': book_id, 'message': 'Book created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/books/<int:book_id>', methods=['GET'])
def get_book(book_id):
    """Get a specific book"""
    book = library.book_repo.get_by_id(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404
    
    return jsonify({
        'id': book.id,
        'title': book.title,
        'author': book.author,
        'genre': book.genre.value,
        'deposit_cost': book.deposit_cost,
        'base_rental_cost': book.base_rental_cost,
        'total_copies': book.total_copies,
        'available_copies': book.available_copies,
        'value': book.value,
        'is_available': book.is_available()
    })


@app.route('/api/books/<int:book_id>', methods=['DELETE'])
def delete_book(book_id):
    """Delete a book"""
    try:
        book = library.book_repo.get_by_id(book_id)
        if not book:
            return jsonify({'error': 'Book not found'}), 404
        
        # Check for non-returned rentals (ACTIVE or OVERDUE)
        non_returned_rentals = library.rental_repo.get_non_returned_rentals()
        has_active_rentals = any(r.book_id == book_id for r in non_returned_rentals)
        
        if has_active_rentals:
            return jsonify({'error': 'Cannot delete book with active rentals'}), 400
        
        library.book_repo.delete(book_id)
        return jsonify({'message': 'Book deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to delete book: {str(e)}'}), 500


@app.route('/api/readers', methods=['GET'])
def get_readers():
    """Get all readers"""
    readers = library.get_all_readers()
    return jsonify([{
        'id': r.id,
        'full_name': r.full_name,
        'address': r.address,
        'telephone': r.telephone,
        'category': r.category.value
    } for r in readers])


@app.route('/api/readers', methods=['POST'])
def create_reader():
    """Register a new reader"""
    data = request.json
    
    try:
        category = ReaderCategory[data['category'].upper()] if isinstance(data['category'], str) else ReaderCategory(data['category'])
        reader = ReaderFactory.create_reader(
            full_name=data['full_name'],
            address=data['address'],
            telephone=data['telephone'],
            category=category
        )
        reader_id = library.add_reader(reader)
        return jsonify({'id': reader_id, 'message': 'Reader registered successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/readers/<int:reader_id>', methods=['GET'])
def get_reader(reader_id):
    """Get a specific reader"""
    reader = library.reader_repo.get_by_id(reader_id)
    if not reader:
        return jsonify({'error': 'Reader not found'}), 404
    
    return jsonify({
        'id': reader.id,
        'full_name': reader.full_name,
        'address': reader.address,
        'telephone': reader.telephone,
        'category': reader.category.value
    })


@app.route('/api/readers/<int:reader_id>', methods=['DELETE'])
def delete_reader(reader_id):
    """Delete a reader"""
    try:
        reader = library.reader_repo.get_by_id(reader_id)
        if not reader:
            return jsonify({'error': 'Reader not found'}), 404
        
        # Check for non-returned rentals (ACTIVE or OVERDUE)
        non_returned_rentals = library.rental_repo.get_non_returned_rentals()
        has_active_rentals = any(r.reader_id == reader_id for r in non_returned_rentals)
        
        if has_active_rentals:
            return jsonify({'error': 'Cannot delete reader with active rentals'}), 400
        
        library.reader_repo.delete(reader_id)
        return jsonify({'message': 'Reader deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to delete reader: {str(e)}'}), 500


@app.route('/api/rentals', methods=['POST'])
def create_rental():
    """Rent a book to a reader"""
    data = request.json
    
    try:
        rental_days = int(data.get('rental_days', 14))
        rental = library.rent_book(
            book_id=int(data['book_id']),
            reader_id=int(data['reader_id']),
            rental_days=rental_days
        )
        
        if not rental:
            return jsonify({'error': 'Book not available or invalid IDs'}), 400
        
        return jsonify({
            'id': rental.id,
            'book_id': rental.book_id,
            'reader_id': rental.reader_id,
            'issue_date': rental.issue_date.isoformat(),
            'expected_return_date': rental.expected_return_date.isoformat(),
            'deposit_paid': rental.deposit_paid,
            'rental_cost': rental.rental_cost,
            'status': rental.status.value
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/rentals', methods=['GET'])
def get_rentals():
    """Get all rentals or active/overdue rentals"""
    status = request.args.get('status', 'all')
    
    if status == 'active':
        rentals = library.get_active_rentals()
    elif status == 'overdue':
        rentals = library.get_overdue_rentals()
    else:
        rentals = library.rental_repo.get_all()
    
    return jsonify([{
        'id': r.id,
        'book_id': r.book_id,
        'reader_id': r.reader_id,
        'issue_date': r.issue_date.isoformat(),
        'expected_return_date': r.expected_return_date.isoformat(),
        'actual_return_date': r.actual_return_date.isoformat() if r.actual_return_date else None,
        'status': r.status.value,
        'deposit_paid': r.deposit_paid,
        'rental_cost': r.rental_cost,
        'fine_amount': r.fine_amount,
        'damage_fine': r.damage_fine,
        'is_overdue': r.is_overdue()
    } for r in rentals])


@app.route('/api/rentals/<int:rental_id>/return', methods=['POST'])
def return_book(rental_id):
    """Return a book"""
    data = request.json or {}
    damage_level = data.get('damage_level')
    
    rental = library.return_book(rental_id, damage_level)
    
    if not rental:
        return jsonify({'error': 'Rental not found or already returned'}), 400
    
    return jsonify({
        'id': rental.id,
        'status': rental.status.value,
        'fine_amount': rental.fine_amount,
        'damage_fine': rental.damage_fine,
        'actual_return_date': rental.actual_return_date.isoformat()
    })


@app.route('/api/reports/available-books', methods=['GET'])
def report_available_books():
    """Report on available book collection"""
    books = library.get_available_books()
    
    return jsonify({
        'total_available': len(books),
        'books': [{
            'id': b.id,
            'title': b.title,
            'author': b.author,
            'genre': b.genre.value,
            'available_copies': b.available_copies,
            'total_copies': b.total_copies
        } for b in books]
    })


@app.route('/api/reports/issued-books', methods=['GET'])
def report_issued_books():
    """Report on issued books with overdue indication"""
    active_rentals = library.get_active_rentals()
    overdue_rentals = library.get_overdue_rentals()
    
    # Get book and reader details
    result = []
    for rental in active_rentals:
        book = library.book_repo.get_by_id(rental.book_id)
        reader = library.reader_repo.get_by_id(rental.reader_id)
        
        result.append({
            'rental_id': rental.id,
            'book_title': book.title if book else 'Unknown',
            'book_author': book.author if book else 'Unknown',
            'reader_name': reader.full_name if reader else 'Unknown',
            'issue_date': rental.issue_date.isoformat(),
            'expected_return_date': rental.expected_return_date.isoformat(),
            'is_overdue': rental.is_overdue(),
            'days_overdue': (date.today() - rental.expected_return_date).days if rental.is_overdue() else 0
        })
    
    return jsonify({
        'total_issued': len(active_rentals),
        'total_overdue': len(overdue_rentals),
        'rentals': result
    })


@app.route('/api/reports/financial-status', methods=['GET'])
def report_financial_status():
    """Report on financial status of subscription"""
    financial = library.get_financial_status()
    return jsonify(financial)


@app.route('/api/reports/financial-history', methods=['GET'])
def report_financial_history():
    """Report on financial operations history"""
    history = library.get_financial_history()
    return jsonify(history)


@app.route('/api/readers/<int:reader_id>/rentals', methods=['GET'])
def get_reader_rentals(reader_id):
    """Get all rentals for a specific reader"""
    rentals = library.get_reader_rentals(reader_id)
    
    return jsonify([{
        'id': r.id,
        'book_id': r.book_id,
        'issue_date': r.issue_date.isoformat(),
        'expected_return_date': r.expected_return_date.isoformat(),
        'actual_return_date': r.actual_return_date.isoformat() if r.actual_return_date else None,
        'status': r.status.value,
        'rental_cost': r.rental_cost,
        'fine_amount': r.fine_amount,
        'damage_fine': r.damage_fine
    } for r in rentals])


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)


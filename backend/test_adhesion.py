"""
Script de test pour le système d'adhésion
"""
import asyncio
from datetime import datetime
from pdf_service import generate_membership_pdf

def test_pdf_generation():
    """Test de génération de PDF"""
    print("🧪 Test de génération de PDF...")
    
    # Test 1: Adhésion professional
    print("\n1️⃣ Test adhésion Professional")
    membership_data_pro = {
        "year": 2026,
        "membership_type": "professional",
        "amount": 50,
        "member_data": {
            "nom": "Dupont",
            "prenom": "Jean",
            "email": "jean.dupont@example.com",
            "telephone": "0612345678",
            "fax": "0412345678",
            "adresse_commerciale": "15 rue du Commerce",
            "code_postal": "13001",
            "ville": "Marseille",
            "rcs": "123456789",
            "type_activite": "commercant",
            "activite_detail": "Boulangerie-Pâtisserie",
            "date_creation_commerce": datetime(2020, 1, 15),
            "is_franchise": True,
            "franchise_status": "actif",
            "enseigne": "Boulangerie Paul"
        }
    }
    
    try:
        pdf_path = generate_membership_pdf(
            membership_data=membership_data_pro,
            membership_id="test-pro-001",
            output_dir="pdf_memberships"
        )
        print(f"✅ PDF généré: {pdf_path}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    
    # Test 2: Adhésion individual
    print("\n2️⃣ Test adhésion Individual")
    membership_data_ind = {
        "year": 2026,
        "membership_type": "individual",
        "amount": 25,
        "member_data": {
            "nom": "Martin",
            "prenom": "Sophie",
            "email": "sophie.martin@example.com",
            "telephone": "0698765432",
            "adresse_commerciale": "25 avenue de la République",
            "code_postal": "75011",
            "ville": "Paris"
        }
    }
    
    try:
        pdf_path = generate_membership_pdf(
            membership_data=membership_data_ind,
            membership_id="test-ind-001",
            output_dir="pdf_memberships"
        )
        print(f"✅ PDF généré: {pdf_path}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 3: Adhésion professional_plus
    print("\n3️⃣ Test adhésion Professional Plus")
    membership_data_plus = {
        "year": 2026,
        "membership_type": "professional_plus",
        "amount": 152.32,
        "member_data": {
            "nom": "Bernard",
            "prenom": "Michel",
            "email": "michel.bernard@example.com",
            "telephone": "0612345678",
            "adresse_commerciale": "50 boulevard des Grandes Surfaces",
            "code_postal": "13700",
            "ville": "Marignane",
            "rcs": "987654321",
            "type_activite": "commercant",
            "activite_detail": "Supermarché",
            "date_creation_commerce": datetime(2015, 6, 1),
            "is_franchise": False
        }
    }
    
    try:
        pdf_path = generate_membership_pdf(
            membership_data=membership_data_plus,
            membership_id="test-plus-001",
            output_dir="pdf_memberships"
        )
        print(f"✅ PDF généré: {pdf_path}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    # Test 4: Adhésion association
    print("\n4️⃣ Test adhésion Association")
    membership_data_asso = {
        "year": 2026,
        "membership_type": "association",
        "amount": 152.32,
        "member_data": {
            "nom": "Dubois",
            "prenom": "Pierre",
            "email": "pierre.dubois@asso-example.org",
            "telephone": "0623456789",
            "adresse_commerciale": "10 place de l'Association",
            "code_postal": "06000",
            "ville": "Nice",
            "nom_association": "Association des Commerçants de Nice",
            "siret": "12345678900012"
        }
    }
    
    try:
        pdf_path = generate_membership_pdf(
            membership_data=membership_data_asso,
            membership_id="test-asso-001",
            output_dir="pdf_memberships"
        )
        print(f"✅ PDF généré: {pdf_path}")
    except Exception as e:
        print(f"❌ Erreur: {e}")
    
    print("\n✅ Tests terminés! Vérifiez les PDF dans pdf_memberships/")

if __name__ == "__main__":
    print("=" * 60)
    print("TEST SYSTÈME D'ADHÉSION")
    print("=" * 60)
    test_pdf_generation()

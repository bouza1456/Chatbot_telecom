import os
import openai
import mysql.connector

# Configuration de la clé API OpenAI
openai.api_key = ""

# Configuration de la connexion MySQL
db_config = {
    'user': 'root',
    'password': 'root',  #entrer le mdps
    'host': 'localhost',
    'database': 'telecom_assistant',
}

# Connexion à la base de données MySQL
conn = mysql.connector.connect(**db_config)
cursor = conn.cursor()


# Fonction pour insérer les offres si elles n'existent pas
def insert_offers():
    offers_data = [
        ("Forfait Mobile 165 DH", "14 heures + 14Go ou 3 heures + 3 heures", "165 DH/mois"),
        ("Forfait Mobile 220 DH", "22 heures + 12 Go ou 12 heures + 30 Go", "220 DH/mois"),
        ("Forfait Mobile 349 DH", "30 heures + 30 Go ou 55 Go + 15 heures", "349 DH/mois"),
        ("Forfait Liberté 59 DH", "3 heures + 3Go + 300 SMS ou 1 heure + 11 Go", "59 DH/mois"),
        ("Forfait Liberté 99 DH", "11 heures + 3 Go ou 4 heures + 14 Go ou 1 heure + 20 Go", "99 DH/mois"),
        ("Forfait Liberté 119 DH", "5 heures + 15 Go ou 22 Go + 2 heures", "119 DH/mois"),
        ("Illimité Mobile 259 DH", "Appels Illimités vers le national, 12 Go, 1000 SMS", "259 DH/mois"),
        ("Illimité Mobile 439 DH", "Appels Illimités vers le national, 100H vers l'international, 35 Go, SMS Illimités", "439 DH/mois"),
        ("Illimité Mobile 649 DH", "Appels Illimités vers le national, Appels Illimités vers l'international, Internet Illimité, SMS Illimités", "649 DH/mois"),
    ]
    cursor.execute('DELETE FROM offers')
    cursor.executemany('INSERT IGNORE INTO offers (name, description, price) VALUES (%s, %s, %s)', offers_data)
    conn.commit()



#fonction pour récupérer les messages commencant par qst
def getquestion():
    query = '''
                SELECT DISTINCT content
                FROM messages
                WHERE role = "user"
                LIMIT 50;
            '''
    cursor.execute(query)
    data = cursor.fetchall()
    simple_list = [item[0] for item in data]
    return simple_list


# Fonction pour récupérer les détails des offres depuis la base de données
def get_offer_details():
    cursor.execute('SELECT name, description, price FROM offers')
    return cursor.fetchall()


# Fonction pour insérer un message dans la base de données
def log_to_db(role, content):
    cursor.execute('INSERT INTO messages (role, content) VALUES (%s, %s)', (role, content))
    conn.commit()


# Fonction de requête OpenAI
def Chat(user_messages) -> str:
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=user_messages,
    )
    return response.choices[0].message['content']


# Fonction pour démarrer le chat
def startChat(user_message):
    insert_offers()  # Initialiser les offres dans la base de données
    Topic = "offres de Maroc Telecom"
    all_messages = [{"role": "system",
                     "content": "Vous êtes un assistant de Maroc Telecom, vous pouvez uniquement répondre aux questions relatives aux offres de Maroc Telecom"}]

    # Commande pour obtenir les détails des offres
    if any(word in user_message for word in ["tarifs", "détails", "offres","offre","tarif"]):
        offers = get_offer_details()
        if offers:
            response = "Voici les détails des offres de Maroc Telecom :\n" + "\n".join(
                f"Offre: {offer[0]}\nDescription: {offer[1]}\nPrix: {offer[2]}\n"
                for offer in offers
            )
        else:
            response = "Je n'ai pas d'informations sur les offres pour le moment."

        log_to_db('user', user_message)
        log_to_db('assistant', response)
        return response

    if user_message == "exit":
        print("Bot : Au revoir !")
        return

    if user_message == "topic":
        print("Bot : Quel est le nouveau sujet sur lequel vous voulez discuter ?")
        Topic = input("Utilisateur : ").strip()
        os.system('cls' if os.name == 'nt' else 'clear')
        all_messages = [{"role": "system",
                         "content": f"Vous êtes un assistant pour les offres de Maroc Telecom, vous pouvez uniquement répondre aux questions relatives aux offres de Maroc Telecom"}]

        return

    all_messages.append({"role": "user", "content": user_message})
    result = Chat(all_messages)
    all_messages.append({"role": "assistant", "content": result})

    log_to_db('user', user_message)
    log_to_db('assistant', result)

    return result
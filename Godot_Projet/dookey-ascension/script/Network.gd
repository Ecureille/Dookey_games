extends Node

const PORT = 8080
var tcp_server = TCPServer.new()
var socket_peers = [] 

func _ready():
	# On écoute sur toutes les interfaces (important pour le tunnel)
	if tcp_server.listen(PORT, "0.0.0.0") == OK:
		print("SERVEUR OK - Port: ", PORT)
		print("Tape dans ton terminal : ngrok http 8080")
	else:
		print("ERREUR : Impossible de lancer le serveur")

func _process(_delta):
	# 1. Accepter les nouvelles connexions
	if tcp_server.is_connection_available():
		var connection = tcp_server.take_connection()
		var peer = WebSocketPeer.new()
		peer.accept_stream(connection)
		socket_peers.append(peer)
		print("NOUVEAU CLIENT CONNECTÉ !")

	# 2. Gérer les messages des clients connectés
	for i in range(socket_peers.size() - 1, -1, -1):
		var peer = socket_peers[i]
		peer.poll() # Indispensable pour mettre à jour l'état du socket
		
		var state = peer.get_ready_state()
		if state == WebSocketPeer.STATE_OPEN:
			while peer.get_available_packet_count() > 0:
				var packet = peer.get_packet()
				var msg = packet.get_string_from_utf8()
				print("REÇU : ", msg)
				
				# ICI : Tu peux déclencher tes actions dans Godot
				if msg.begins_with("CLIC:"):
					var score = msg.split(":")[1]
					print("Score reçu du téléphone : ", score)
					
		elif state == WebSocketPeer.STATE_CLOSED:
			print("Client déconnecté.")
			socket_peers.remove_at(i)

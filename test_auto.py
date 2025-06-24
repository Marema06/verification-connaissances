def est_pair(nombre):
    if nombre % 2 == 0:
        return True
    else:
        return False

# Exemple d'utilisation
n = 7
if est_pair(n):
    print(f"{n} est pair.")
else:
    print(f"{n} est impair.")

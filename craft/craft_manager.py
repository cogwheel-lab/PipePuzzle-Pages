import csv
import re
from PIL import Image, ImageEnhance
import pytesseract

# Tesseract-OCRの実行ファイルへのパスを環境に合わせて設定してください
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def read_recipes(file_path='recipes.csv'):
    recipes = {}
    try:
        with open(file_path, mode='r', encoding='utf-8') as infile:
            reader = csv.DictReader(infile)
            for row in reader:
                item_name = row['itemName']
                if item_name not in recipes:
                    recipes[item_name] = []
                recipes[item_name].append({
                    'materialName': row['materialName'],
                    'quantityRequired': int(row['quantityRequired'])
                })
    except FileNotFoundError:
        print(f"エラー: {file_path} が見つかりません。")
        return None
    return recipes

def preprocess_image(image_path):
    image = Image.open(image_path)
    gray = image.convert('L')
    enhancer = ImageEnhance.Contrast(gray)
    contrast = enhancer.enhance(2.5)
    threshold = 180
    binary = contrast.point(lambda p: 255 if p > threshold else 0)
    return binary

def ocr_from_image(image_path):
    try:
        image = Image.open(image_path).convert('L')  # ← モノクロ化
        image = image.point(lambda x: 0 if x < 180 else 255, '1')  # ← 白黒2値化（閾値180）

        text = pytesseract.image_to_string(image, lang='jpn')

        print("\n--- OCR生テキスト ---")
        print(text)
        print("----------------------")

        materials = {}
        for line in text.split('\n'):
            match = re.match(r'(.+?)\s*[xX×]\s*(\d+)', line)
            if match:
                name = match.group(1).strip()
                quantity = int(match.group(2))
                materials[name] = quantity
        return materials
    except Exception as e:
        print(f"OCRエラー: {e}")
        return None


def manual_input_materials(required_materials):
    print("📝 OCRの代わりに手入力で素材の所持数を入力します。")
    owned = {}
    for mat in required_materials:
        name = mat['materialName']
        try:
            qty = int(input(f"- {name} の所持数を入力してください: "))
            owned[name] = qty
        except ValueError:
            print(f"{name} の数値が無効です。0として処理します。")
            owned[name] = 0
    return owned

def calculate_missing_materials(item_name, recipes, owned_materials):
    if item_name not in recipes:
        print(f"エラー: アイテム '{item_name}' のレシピが見つかりません。")
        return None

    missing = []
    required_materials = recipes[item_name]

    for material in required_materials:
        name = material['materialName']
        required_qty = material['quantityRequired']
        owned_qty = owned_materials.get(name, 0)

        if owned_qty < required_qty:
            missing.append({
                'materialName': name,
                'quantityMissing': required_qty - owned_qty
            })

    return missing

def write_missing_materials_csv(missing_materials, file_path='missing_materials.csv'):
    if not missing_materials:
        print("✨ 不足している素材はありません。")
        return

    try:
        with open(file_path, mode='w', newline='', encoding='utf-8') as outfile:
            writer = csv.DictWriter(outfile, fieldnames=['materialName', 'quantityMissing'])
            writer.writeheader()
            writer.writerows(missing_materials)
        print(f"📄 不足素材を {file_path} に書き出しました。")
    except IOError:
        print(f"エラー: {file_path} に書き込めませんでした。")

def main():
    recipes = read_recipes()
    if recipes is None:
        return

    item_list = list(recipes.keys())
    print("利用可能なクラフトアイテム:")
    for idx, item in enumerate(item_list, start=1):
        print(f"[{idx}] {item}")

    try:
        choice = int(input("作成したいアイテムの番号を入力してください: "))
        target_item = item_list[choice - 1]
    except (ValueError, IndexError):
        print("無効な番号です。処理を終了します。")
        return

    print("\n素材所持数の入力方法を選んでください:")
    print("[1] OCR（画像から読み取り）")
    print("[2] manual（手動入力）")

    mode_input = input("番号を入力してください: ").strip()

    if mode_input == '1':
        image_path = input("素材一覧のスクリーンショット画像のファイル名を入力してください: ")
        owned_materials = ocr_from_image(image_path)
        if owned_materials is None:
            return
    elif mode_input == '2':
        owned_materials = manual_input_materials(recipes[target_item])
    else:
        print("無効なモード選択です。処理を終了します。")
        return

    print("\n--- 所持素材 ---")
    for name, qty in owned_materials.items():
        print(f"{name}: {qty}")
    print("------------------\n")

    missing = calculate_missing_materials(target_item, recipes, owned_materials)

    if missing is not None:
        write_missing_materials_csv(missing)

if __name__ == '__main__':
    main()

import type { CoupleTodoItem } from "@/lib/todo-types";

export const STARTER_TODO_VERSION = "romantic-list-v1";

export const STARTER_TODO_TEXTS = [
  "Birlikte gün batımını izleyip gece yıldızları, sabah gün doğumunu beklemek",
  "Birbirimize mektup yazıp bir yıl sonra açmak",
  "Beraber aynı kitabı okuyup en sevdiğimiz yerleri konuşmak",
  "İlk buluşmamızı yeniden yapmak",
  "Gelecekteki bize, bir yıl sonraki hâlimize mektup yazmak",
  "Birbirimize 100 TL bütçeyle sürpriz hediye hazırlamak",
  "Birlikte karaoke yapmak; şarkıyı sen seç, söylemek bana düşsün",
  "Birbirimize yemek yapıp puan vermek",
  "Plansızca bir şehir gezisine çıkmak",
  "Telefonları bir kenara bırakıp uzun bir kahve sohbeti yapmak",
  "Gökyüzünde takımyıldızları bulmaya çalışmak",
  "Sahilde ya da parkta piknik yapmak",
  "Yağmurda kısa bir yürüyüşe çıkıp sonra sıcak çikolata içmek",
  "Birbirimize özel şarkılardan ortak bir çalma listesi hazırlamak",
  "İlk fotoğrafımızı aynı yerde yeniden çekmek",
  "Daha önce hiç denemediğimiz bir tatlıyı birlikte yapmak",
  "Kutu oyunu oynayıp kazanana küçük bir ödül vermek",
  "Haritada rastgele bir yer seçip orayı keşfetmek",
  "Bir müze ya da sergiyi gezip en sevdiklerimizi seçmek",
  "Birbirimize çocukluğumuzdan kalan yemekleri pişirmek",
  "Evde sinema gecesi yapıp filmi sırayla seçmek",
  "Bir fotoğraf kabininde komik pozlar verip şerit fotoğrafı saklamak",
  "Bir yıl sonraki kendimize ses kaydı bırakmak",
  "Bir çiçek ya da fidan alıp beraber büyütmek",
  "Birbirimize el yapımı ayraç hazırlayıp kitaplarımızda saklamak",
  "Bir günümüzü fotoğraflarla anlatan minicik bir film çekmek",
  "Birlikte seramik ya da çömlek yapmayı denemek",
  "Yeni bir semtte kaybolmaya izin verip sokakları keşfetmek",
  "En sevdiğimiz fotoğraflardan küçük bir albüm hazırlamak",
  "Birbirimize çocukluğumuzdan en komik anıları anlatmak",
  "Birbirimizde sevdiğimiz on şeyi yazıp aynı anda okumak",
  "Birlikte dans etmeyi öğrenmek; önce salonda denemek",
  "Büyük bir puzzle seçip parça parça tamamlamak",
  "Sahilden birer taş seçip o günü hatırlamak için saklamak",
  "Birbirimize hiç beklemediğimiz bir anda el yazısıyla not bırakmak",
  "Daha önce girmediğimiz küçük bir mahalle kafesi bulmak",
  "Uzakta olduğumuz bir akşam aynı filmi başlatıp görüntülü konuşmak",
  "Aynı tarifi iki ayrı yerde yapıp soframızı görüntülü aramada paylaşmak",
  "Aynı saatte aynı şarkıyı dinleyip birbirimize ne hissettirdiğini anlatmak",
  "Birbirimize sevdiğimiz bir şiiri ya da kitap bölümünü sesli okumak",
  "Birlikte bir hayal panosu ve gitmek istediğimiz yerlerin haritasını yapmak",
  "Gece müzik açıp kısa bir araba yolculuğuna çıkmak",
  "Yıldızların altında battaniyeye sarılıp uzun uzun sohbet etmek",
  "Bir kitapçıda birbirimize bir kitap seçip nedenini anlatmak",
  "Evde sadece beş malzemeyle akşam yemeği hazırlamak",
  "Sırayla birbirimize çocukluğumuzdan bir çizgi film izletmek",
  "Birbirimiz için küçük bir hazine avı ve ipuçları hazırlamak",
  "Birlikte bir gönüllülük etkinliğine katılıp birine iyilik yapmak",
  "Bir akşamı telefonsuz geçirip sadece birbirimize vakit ayırmak",
  "Bir yıl sonra bu listeyi açıp yaptıklarımızı birlikte hatırlamak",
] as const;

export function createStarterTodos(): CoupleTodoItem[] {
  return STARTER_TODO_TEXTS.map((text, index) => ({
    // Stable UUIDs keep the starter items from duplicating across devices.
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    text,
    done: false,
  }));
}

export function isStarterTodoId(id: string) {
  return /^00000000-0000-4000-8000-(?:0{11}[1-9]|0{10}[1-4][0-9]|0{10}50)$/.test(id);
}

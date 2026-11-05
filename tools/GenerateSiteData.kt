import com.ncaps.nammapanchanga.core.*
import java.io.File

val table = LinkedHashMap<String, Int>()
val names = ArrayList<Pair<String, String>>()
fun idx(b: Bi): Int = table.getOrPut(b.kn + "|" + b.en) { names.add(b.kn to b.en); names.size - 1 }
fun esc(s: String) = "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

fun main(args: Array<String>) {
    val out = File(args[0]); out.mkdirs()
    val towns = Cities.ALL.filter { it.region == Region.KA || it.id in setOf("chennai", "hyderabad", "mumbai", "pune", "delhi") }
    val start = java.time.LocalDate.of(2026, 11, 1); val end = java.time.LocalDate.of(2027, 12, 31)
    val townJson = StringBuilder("[")
    towns.forEachIndexed { ti, place ->
        if (ti > 0) townJson.append(',')
        townJson.append("{\"id\":${esc(place.id)},\"kn\":${esc(place.name.kn)},\"en\":${esc(place.name.en)},\"lat\":${place.lat},\"lon\":${place.lon},\"ka\":${place.region == Region.KA}}")
        val sb = StringBuilder("{")
        var d = start; var first = true
        while (!d.isAfter(end)) {
            val key = DayKey(d.year, d.monthValue, d.dayOfMonth)
            val p = Panchanga.day(key, place)
            val mid = Panchanga.localMidnight(key, place)
            fun m(ms: Long?) = if (ms == null) "null" else ((ms - mid) / 60000).toString()
            val fest = Festivals.on(key, place).filter { it.kind != Kind.MOON }.map { idx(it.name) }
            val moonFest = Festivals.on(key, place).filter { it.kind == Kind.MOON }.map { idx(it.name) }
            if (!first) sb.append(','); first = false
            sb.append("\"%04d-%02d-%02d\":[".format(d.year, d.monthValue, d.dayOfMonth))
            sb.append(listOf(
                p.weekday, idx(p.samvatsara), idx(p.ayana), idx(p.ritu), idx(p.masa.name), if (p.masa.adhika) 1 else 0, p.paksha,
                idx(p.tithi.name), m(p.tithi.end), idx(p.tithi.next),
                idx(p.nakshatra.name), m(p.nakshatra.end), idx(p.nakshatra.next),
                idx(p.yoga.name), m(p.yoga.end), idx(p.karana.name),
                m(p.sunrise), m(p.sunset), m(p.moonrise), m(p.moonset),
                m(p.rahu.start), m(p.rahu.end), m(p.yamaganda.start), m(p.yamaganda.end), m(p.gulika.start), m(p.gulika.end),
                m(p.abhijit?.start), m(p.abhijit?.end), p.tithi.index,
            ).joinToString(","))
            sb.append(",[").append(fest.joinToString(",")).append("],[").append(moonFest.joinToString(",")).append("]]")
            d = d.plusDays(1)
        }
        sb.append("}")
        File(out, place.id + ".json").writeText(sb.toString())
        System.err.println("done " + place.id)
    }
    townJson.append("]")
    File(out, "towns.json").writeText(townJson.toString())
    val nm = StringBuilder("[")
    names.forEachIndexed { i, (kn, en) -> if (i > 0) nm.append(','); nm.append("[${esc(kn)},${esc(en)}]") }
    nm.append("]")
    File(out, "names.json").writeText(nm.toString())
    val misc = StringBuilder("{")
    misc.append("\"vara\":[" + (0..6).joinToString(",") { "[${esc(Names.VARA[it].kn)},${esc(Names.VARA[it].en)}]" } + "],")
    misc.append("\"paksha\":[" + (0..1).joinToString(",") { "[${esc(Names.PAKSHA[it].kn)},${esc(Names.PAKSHA[it].en)}]" } + "],")
    misc.append("\"months\":[" + (0..11).joinToString(",") { "[${esc(Names.MONTHS[it].kn)},${esc(Names.MONTHS[it].en)}]" } + "],")
    misc.append("\"rashi\":[" + (0..11).joinToString(",") { "[${esc(Names.RASHI[it].kn)},${esc(Names.RASHI[it].en)}]" } + "]")
    misc.append("}")
    File(out, "misc.json").writeText(misc.toString())
}

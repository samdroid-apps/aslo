package main

type DBRating struct {
	BundleId  string `gorethink:"bundle_id"`
	Id        string
	Email     string
	EmailHash string `gorethink:"email_hash"`

	Text   string
	Rating int
	Time   float64

	Flagged bool
	Deleted bool
}

type Person struct {
	Id          string
	NumSame     float64
	NumConflict float64
	MagicNum    float64
	Recommend    []string
}

func (p *Person) AddRecommendation(x string) {
	p.Recommend = append(p.Recommend, x)
}

func (p *Person) CalcMagic() {
	total := p.NumSame + p.NumConflict

	over := total
	if total < 3 {
		over = 3
	}

	p.MagicNum = (p.NumSame / over) -  (p.NumConflict / over)
}

func makePerson(id string) *Person {
	return &Person{
		Id: id,
		NumSame: 0,
		NumConflict: 0}
}

type JustEmail struct {
	Email string
}

type MagicId struct {
	Magic float64 `json:"confidence"`
	Id    string  `json:"bundleId"`
}

type ByMagic     []MagicId
func (a ByMagic) Len() int           { return len(a) }
func (a ByMagic) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByMagic) Less(i, j int) bool { return a[i].Magic > a[j].Magic }

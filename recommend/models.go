package main

type JSONResponce struct {
	Confidence    float64  `json:"confidence"`
	Recommendations  []string `json:"recommendations"`
}

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
